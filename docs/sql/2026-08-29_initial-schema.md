# 2026-08-29 · 초기 스키마 (예측 게임)

- **대상 DB**: MySQL 8.x (HeidiSQL 작업 기준)
- **SQL 파일**: [`2026-08-29_initial-schema.sql`](./2026-08-29_initial-schema.sql)
- **변경 유형**: 신규 (전체 스키마 최초 정의)
- **구성**: 테이블 9개 + 관리자용 컬럼 추가 3건 + 저장 프로시저 7개 + 참고 쿼리 모음

---

## 1. 한눈에 보기

이 게임은 유저가 "Yes / No" 예측 주제에 투표하고, 관리자가 결과를 확정하면
**신용도 점수(credibility_score)** 가 오르내리며, 점수에 따라 **티어**가 매겨진다.

```
categories ──< topics ──< votes ──< score_settlements
                 │                        │
users ──<────────┴───────< tier_changes   │
  │                                       │
  ├──< votes ────────────────────────────┘
  ├──< share_clicks (referral_code ─┐)
  │        users.referred_by_code ──┘  순환 참조라 FK는 나중에 ALTER로 추가
  ├──< login_sessions
  └──< weekly_activity_snapshots ──> tier_changes.snapshot_id (나중에 ALTER로 추가)
```

### FK를 나중에 거는 이유

DDL이 위에서 아래로 실행되므로, 아직 만들어지지 않은 테이블을 참조하는 FK는
테이블 생성 시점에 걸 수 없다. 그래서 아래 2건은 파일 하단에서 `ALTER TABLE`로 추가한다.

| 컬럼 | 참조 대상 | 이유 |
|---|---|---|
| `tier_changes.snapshot_id` | `weekly_activity_snapshots.snapshot_id` | 6번 테이블이 9번 테이블보다 먼저 생성됨 |
| `users.referred_by_code` | `share_clicks.referral_code` | `users`(2번) ↔ `share_clicks`(7번) 순환 참조 |

---

## 2. 테이블 상세

### 1) `categories` — 카테고리 고정값
- `category_id` `TINYINT UNSIGNED` PK, `name` `VARCHAR(30)` UNIQUE
- 정치(1)·스포츠(2)·E스포츠(3)·경제(4)·날씨(5) **5개를 INSERT로 고정**. 유저가 추가/삭제하지 않는다.

### 2) `users` — 유저 + 누적 점수 + 현재 티어
| 컬럼 | 설명 |
|---|---|
| `user_id` | `BIGINT UNSIGNED` AUTO_INCREMENT PK |
| `nickname` | 닉네임 |
| `signup_channel` | 유입 경로(`direct`, `kakao` 등). 모르면 NULL |
| `referred_by_code` | 가입 시 사용한 추천 코드. `share_clicks.referral_code` 참조, 없으면 NULL |
| `credibility_score` | 누적 신용도 점수. **하한 0은 애플리케이션/프로시저 레벨에서 강제** (컬럼 제약 아님) |
| `tier` | 현재 티어 문자열. 가입 직후 `'언랭크'` |
| `created_at` | 가입일시 |
| `role` *(10번에서 추가)* | `ENUM('user','admin')` 기본 `'user'`. 관리자 페이지 접근 판정 |
| `activity_suppressed` *(10번에서 추가)* | `TINYINT(1)` 기본 0. 1이면 점수가 충분해도 실시간 정산으로는 다이아/마스터 복귀 불가 |

### 3) `topics` — 투표 주제
| 컬럼 | 설명 |
|---|---|
| `status` | `ENUM('open','pending_result','confirmed','void')` — 투표중 / 결과대기 / 확정 / 무효 |
| `vote_start_at`, `vote_deadline_at` | 투표 시작·마감 시각 |
| `confirmed_at`, `correct_answer` | 결과 확정 시각과 정답(`yes`/`no`). void면 둘 다 NULL |
| `yes_count`, `no_count` | **마감 시점 득표수 스냅샷** (점수 계산용). 확정 프로시저가 채운다 |
| `confirmed_by` *(10번에서 추가)* | 확정을 실행한 관리자 `user_id` (책임 추적용) |
- 인덱스: `idx_topics_category_status(category_id, status)`, `idx_topics_deadline(vote_deadline_at)`

### 4) `votes` — 투표 참여 기록
- `choice` `ENUM('yes','no')`, `voted_at`
- **`uq_votes_user_topic(user_id, topic_id)` UNIQUE** — 유저당 한 주제에 1표만. 중복 투표 원천 차단
- 인덱스: `idx_votes_topic`(정산 시 참여자 조회), `idx_votes_user_time(user_id, voted_at)`(주간 참여횟수 집계)

### 5) `score_settlements` — 점수 정산 결과
| 컬럼 | 설명 |
|---|---|
| `vote_id` | 원 투표. **UNIQUE 아님** — 정정 후 재정산으로 같은 vote에 레코드가 또 생길 수 있음 |
| `result` | `ENUM('correct','incorrect','void')` |
| `p_value` | 득표비율 p. `DECIMAL(5,4)` (반올림 오차 없음) |
| `score_delta` | 이번 정산의 점수 변동분 (+/-) |
| `score_after` | 정산 직후 누적 점수 스냅샷 |
| `is_reversed` | `TINYINT(1)`. 1이면 오확정 정정으로 무효화된 기록. **삭제하지 않고 감사용으로 보존** |
- 유효한(정산에 반영되는) 기록은 항상 `is_reversed = 0` 조건으로 걸러 읽어야 한다.

### 6) `tier_changes` — 티어 변경 이력
- `previous_tier`, `new_tier` — 승급/강등 방향은 **저장하지 않음**. 두 값을 비교하면 항상 알 수 있으므로 중복 저장 방지
- `reason` `ENUM('score_based','activity_based','correction')`
  - `score_based` — 정산 시 점수 변동에 따른 자연스러운 변경
  - `activity_based` — 다이아/마스터 주간 참여 5회 체크 결과
  - `correction` — 관리자 오확정 정정에 따른 재계산 결과
- `snapshot_id` — `activity_based`일 때만 채움. `weekly_activity_snapshots` 참조

### 7) `share_clicks` — 공유 버튼 클릭 로그
- `referral_code` `VARCHAR(20)` **UNIQUE** — 클릭마다 고유 코드를 발급해 링크에 심어 배포
- `users.referred_by_code`가 이 값을 참조

### 8) `login_sessions` — 로그인 기록
- `user_id`, `login_at`만 있는 단순 이벤트 로그

### 9) `weekly_activity_snapshots` — 주간 활동성 체크 스냅샷
- 매주 일요일 자정 배치가 계산한 결과를 **영구 보존**
- `week_start`(월)·`week_end`(일), `vote_count`(그 주 투표 수 고정값), `met_requirement`(5회 충족 여부)
- `tier_before`, `tier_after` — 체크 직전/직후 티어
- **`uq_snapshot_user_week(user_id, week_start)` UNIQUE** — 유저당 주 1건

---

## 3. 신용도 점수 계산식 (`sp_confirm_topic_result` 기준)

마감 시점 득표수 `yes_count`, `no_count`, 총합 `N = yes_count + no_count`.
유저 선택이 소수파일수록(적중 시) 보상이 크고, 다수파에 섰다가 틀리면 손실이 크다.

```
# 유저가 고른 쪽의 라플라스 보정 득표비율
p = (선택한 쪽 득표수 + 5) / (N + 10)          -- 소수 넷째 자리 반올림

# 접전일수록 커지는 보너스 (p=0.5에서 최대 2, p가 0 또는 1이면 0)
bonus = 2 * (1 - 4 * (p - 0.5)^2)

# 점수 변동
정답: score_delta = round( 40 * (1 - p) + bonus )
오답: score_delta = round( -(40 * p - bonus) )

# 누적 반영 (하한 0)
score_after = max(0, score_before + score_delta)
```

- **무효(void)**: 정산 레코드는 `result='void'`, `p_value=0.5`, `score_delta=0`으로 남기고 점수는 그대로.
- 라플라스 보정(+5 / +10)은 표본이 적은 주제에서 p가 0/1로 튀는 것을 막는다.

---

## 4. 티어 기준표

`credibility_score`와 `activity_suppressed` 조합으로 결정.

| 점수 구간 | `activity_suppressed = 0` | `activity_suppressed = 1` |
|---|---|---|
| ≥ 500 | 마스터 | 플래티넘 |
| 400 – 499 | 다이아 | 플래티넘 |
| 300 – 399 | 플래티넘 | 플래티넘 |
| 200 – 299 | 골드 | 골드 |
| 100 – 199 | 실버 | 실버 |
| 1 – 99 | 브론즈 | 브론즈 |
| 0 | 언랭크 | 언랭크 |

- **다이아/마스터로의 실시간 복귀는 불가**. `activity_suppressed=1`이면 실시간 정산은 플래티넘까지만 올려주고,
  다이아/마스터 복귀는 오직 주간 활동성 체크(`sp_weekly_activity_check`)에서 5회 조건을 채웠을 때만 이뤄진다.

---

## 5. 저장 프로시저

| 프로시저 | 트리거 | 요약 |
|---|---|---|
| `sp_confirm_topic_result(topic_id, answer, admin_id)` | 관리자 "확정" 버튼 | `answer`는 `yes`/`no`/`void`. 득표 확정 → 정산 → 점수·티어 갱신 → 로그. **`open`/`pending_result` 상태에서만** 허용 (중복 정산 방지) |
| `sp_weekly_activity_check(week_start, week_end)` | 매주 일요일 자정 배치 | `credibility_score >= 400` 유저 전원 대상. 그 주 투표 5회 미만이면 표시 강등 + `activity_suppressed=1`, 5회 이상이면 점수 기준 티어 복귀 + `activity_suppressed=0`. 스냅샷은 통과/실패 모두 기록 |
| `sp_correct_topic_result(topic_id)` | 관리자 "정정" 버튼 | **`confirmed`/`void` 상태에서만**. 기존 정산을 `is_reversed=1`로 표시(삭제 안 함), 영향 유저 점수를 남은 정산만으로 시간순 재생(replay), 주제를 `pending_result`로 되돌림. 이후 올바른 답으로 `sp_confirm_topic_result` 재호출 |
| `sp_update_topic(topic_id, category_id, title, description, vote_start_at, vote_deadline_at)` | 관리자 주제 편집 | **`open` + 참여자 0명일 때만** 전체 내용 수정 허용 |
| `sp_extend_topic_deadline(topic_id, new_deadline)` | 관리자 마감 연장 | **`open` 상태**에서 마감시각 **연장만** 가능(단축 불가). 참여자 있어도 허용 |
| `sp_set_admin_role(target_user_id, new_role, actor_user_id)` | 관리자 권한 관리 | `actor`가 admin이어야 실행 가능. **마지막 남은 관리자는 강등 불가** |

모든 프로시저는 `DECLARE EXIT HANDLER FOR SQLEXCEPTION → ROLLBACK; RESIGNAL;` 로
중간 실패 시 자동 롤백한다. 검증 실패는 `SIGNAL SQLSTATE '45000'` + 한국어 메시지로 알린다.

### 재확정 시 올바른 순서
```
CALL sp_correct_topic_result(123);              -- 기존 정산 무효화 + pending_result 복귀
CALL sp_confirm_topic_result(123, 'no', 5);     -- 올바른 정답으로 재정산
```
확정된 주제에 `sp_confirm_topic_result`를 바로 다시 부르면 막힌다(정정 프로시저를 먼저 거쳐야 함).

---

## 6. MySQL 8 관련 주의사항 (프로시저 내부)

### (1) `COLLATE utf8mb4_unicode_ci` 명시 필수
`CASE ... END`로 만든 문자열 리터럴은 MySQL 8 기본값 `utf8mb4_0900_ai_ci`를 갖는다.
이걸 테이블 컬럼(`utf8mb4_unicode_ci`)과 `!=` 비교하면 **"Illegal mix of collations"** 에러가 난다.
그래서 티어 계산 `CASE` 결과에는 항상 `COLLATE utf8mb4_unicode_ci`를 붙인다.

### (2) 재귀 CTE 안에서 TEMPORARY TABLE 재참조 불가 (에러 1137)
`sp_correct_topic_result`의 점수 재생 로직은 "영향받은 유저 목록"을 임시테이블에 담고 싶지만,
`WITH RECURSIVE` 안에서 같은 TEMPORARY TABLE을 두 번 열 수 없다.
그래서 일반 테이블인 `score_settlements`를
`user_id IN (SELECT DISTINCT user_id FROM score_settlements WHERE topic_id = ?)` 서브쿼리로 매번 참조한다.

### (3) 점수 재생(replay) 방식
정정 시 단순히 `score_delta`를 빼는 게 아니라, `is_reversed=0`인 정산만 남기고
`settled_at, settlement_id` 순서로 `GREATEST(0, 직전점수 + delta)`를 재귀적으로 다시 계산한다.
중간에 0 하한에 걸렸던 이력까지 정확히 재현하기 위함이다.
이 주제 정산만 갖고 있던 유저는 재생할 게 없으므로 `credibility_score = 0`으로 세팅한다.

---

## 7. 참고 쿼리 모음 (SQL 파일 16번 섹션)

관리자 페이지에서 자주 쓰는 조회/배치 쿼리 15종이 **주석 형태**로 SQL 파일 하단에 정리되어 있다
(실행 대상 아님, 복사해서 사용). 주요 항목:

- ③ 마감 지난 `open` 주제를 `pending_result`로 자동 전환 (크론)
- ⑥ 정정 버튼 노출 판단용 — 확정 상태 + 유효 정산 건수 확인
- ⑦ 주제 목록 (카테고리/상태/검색어 필터 + 페이지네이션)
- ⑧ 주제 수정 가능 여부 (`can_full_edit`, `can_extend_deadline`)
- ⑬ 유저 상세 통계 (정답률 = `correct_count / graded_count`, 계산은 앱에서)
