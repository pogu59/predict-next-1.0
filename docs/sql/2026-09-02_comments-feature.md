# 2026-09-02 · 댓글(커뮤니티) 기능 추가

- **대상 DB**: MySQL 8.x
- **SQL 위치**: [`2026-08-29_initial-schema.sql`](./2026-08-29_initial-schema.sql) 하단에 **17 ~ 19번 섹션**으로 추가됨
  (별도 파일이 아니라 초기 스키마 파일에 이어 붙인 형태)
- **변경 유형**: 추가 — 테이블 3개 + 저장 프로시저 5개 + 참고 쿼리
- **선행 조건**: 초기 스키마(`topics`, `users`, `votes`)가 이미 생성되어 있어야 함

---

## 0. 수정 완료된 오타 (기록용)

한때 `comments` 테이블 정의의 `is_deleted` 컬럼에 잘못된 토큰 `x`가 끼어 있어
(`is_deleted  x  TINYINT(1) ...`) `CREATE TABLE comments`가 문법 에러로 실패했다.
**현재 SQL 파일에서는 제거되어 정상**이다. 아래 문서는 정상 상태를 전제로 한다.

---

## 1. 기능 개요

각 투표 주제(`topics`)에 달리는 댓글 시스템.

- **작성 자격**: 그 주제에 **먼저 투표한 유저만** 댓글/대댓글 작성 가능 (`votes` 존재 여부로 강제)
- **스레드 깊이**: 원댓글 + 1단계 대댓글까지만. 대댓글에는 다시 답글 불가
- **삭제**: 소프트 삭제 — 행을 지우지 않고 `is_deleted` 플래그만 세워, 대댓글이 달린 원댓글이 삭제돼도 스레드가 끊기지 않게 함
- **작성자 표시 정보**(현재 티어 / 신용도 점수 / 그 주제에서 고른 Yes·No 태그)는 **댓글에 저장하지 않고** 조회 시점에 `users`, `votes`와 조인해 항상 최신값으로 보여줌

---

## 2. 테이블 (SQL 17번 섹션)

### 2-1. `comments` — 댓글 본문

| 컬럼 | 설명 |
|---|---|
| `comment_id` | `BIGINT UNSIGNED` AUTO_INCREMENT PK |
| `topic_id` | 댓글이 달린 주제. `topics` 참조 |
| `user_id` | 작성자. `users` 참조. **이 주제에 투표한 유저여야 함**(프로시저에서 검증) |
| `parent_comment_id` | 대댓글이면 원댓글 `comment_id`, 원댓글이면 NULL. `comments` 자기참조 |
| `content` | 본문 `TEXT NOT NULL` |
| `like_count` | 좋아요 수 **캐시**. `comment_likes` 집계값. 좋아요순 정렬 최적화용이며 `sp_toggle_comment_like`만 갱신 |
| `is_deleted` | `TINYINT(1)` 기본 0. 소프트 삭제 여부 (0=정상, 1=삭제) |
| `deleted_reason` | `ENUM('self','moderation')` NULL. 본인 삭제 / 관리자 조치. 미삭제면 NULL |
| `deleted_at` | 삭제 시각. 미삭제면 NULL |
| `created_at` | 작성 시각 |
| `updated_at` | `ON UPDATE CURRENT_TIMESTAMP`. 좋아요 수 갱신·삭제 처리 포함 마지막 변경 시각 |

인덱스:

| 인덱스 | 용도 |
|---|---|
| `idx_comments_topic_created (topic_id, created_at)` | 최신순 정렬 조회 |
| `idx_comments_topic_likes (topic_id, like_count)` | 좋아요순 정렬 조회 |
| `idx_comments_parent (parent_comment_id)` | 특정 원댓글의 대댓글 조회 (FK 인덱스 겸용) |
| `idx_comments_user (user_id)` | 유저별 조회 / 신용도순 정렬 시 `users` 조인 |

### 2-2. `comment_likes` — 댓글 좋아요 (토글)

| 컬럼 | 설명 |
|---|---|
| `like_id` | PK |
| `comment_id` | `comments` 참조 |
| `user_id` | `users` 참조 |
| `created_at` | 좋아요 누른 시각 |

- **`uq_comment_likes_comment_user (comment_id, user_id)` UNIQUE** — 유저당 댓글 1좋아요
- `idx_comment_likes_user` — 유저가 좋아요한 댓글 목록 조회
- 토글 취소 시 행을 **물리 삭제**하고 `comments.like_count`를 −1

### 2-3. `comment_reports` — 댓글 신고

| 컬럼 | 설명 |
|---|---|
| `report_id` | PK |
| `comment_id` | 신고 대상 댓글. `comments` 참조 |
| `reporter_user_id` | 신고자. `users` 참조 |
| `reason_code` | `ENUM('spam','abuse','sexual','advertisement','etc')` — 도배 / 욕설·비방 / 음란 / 광고 / 기타 |
| `reason_detail` | `VARCHAR(255)` NULL. 상세 사유 (선택) |
| `status` | `ENUM('pending','dismissed','actioned')` 기본 `pending` — 검토대기 / 기각 / 조치완료(댓글 삭제됨) |
| `handled_by` | 처리한 관리자. `users` 참조. 미처리면 NULL |
| `handled_at` | 처리 시각. 미처리면 NULL |
| `moderator_note` | 관리자 처리 메모 (선택) |
| `created_at` | 신고 접수 시각 |

- **`uq_comment_reports_comment_reporter (comment_id, reporter_user_id)` UNIQUE** — 같은 유저가 같은 댓글 중복 신고 불가
- `idx_comment_reports_status` — 검토대기 목록 조회 (관리자 페이지)
- `idx_comment_reports_comment` — 특정 댓글에 걸린 신고 조회

---

## 3. 저장 프로시저 (SQL 18번 섹션)

모든 프로시저는 기존 프로시저와 동일한 규칙을 따른다: 상태 변경 전 현재 상태를 확인해
이미 처리된 상태면 `SIGNAL SQLSTATE '45000'` + 한국어 메시지로 중단하고,
예외 시 `EXIT HANDLER`로 자동 `ROLLBACK` 후 `RESIGNAL`.
이 기능은 재귀 CTE·임시테이블·계산 문자열 비교를 쓰지 않아
"재귀 CTE + 임시테이블"(에러 1137)이나 "Illegal mix of collations" 이슈가 발생할 지점이 없다.

| 프로시저 | 파라미터 | 규칙 / 동작 |
|---|---|---|
| `sp_create_comment` | `topic_id, user_id, parent_comment_id, content` | 본문 공백이면 에러 · **그 주제 투표자만** 작성 가능 · 대댓글이면 부모 검증(존재해야 / 같은 주제여야 / 부모가 원댓글이어야 = 1단계 제한 / 부모가 삭제 안 됐어야) · 성공 시 `comment_id` 반환 |
| `sp_toggle_comment_like` | `comment_id, user_id` | 댓글 존재 확인 · 이미 좋아요면 **취소**(행 삭제 + `like_count` −1, 삭제된 댓글도 취소는 허용) · 아니면 **추가**(삭제된 댓글엔 불가) · `comment_id, action('liked'/'unliked'), like_count` 반환 |
| `sp_delete_comment` | `comment_id, user_id` | **본인 댓글만** · 이미 삭제됐으면 에러 · 소프트 삭제(`is_deleted=1, deleted_reason='self', deleted_at=NOW()`) |
| `sp_report_comment` | `comment_id, reporter_user_id, reason_code, reason_detail` | `reason_code` 값 검증 · 댓글 존재 확인 · 삭제된 댓글 신고 불가 · **본인 댓글 신고 불가** · 중복 신고 불가 · 성공 시 `report_id` 반환 |
| `sp_moderate_comment` | `report_id, admin_id, action, note` | **`role='admin'`만** · `action`은 `dismiss`/`delete` · 이미 처리된(`pending` 아님) 신고 재처리 불가 · `dismiss` = 이 신고만 종료, 댓글 유지 · `delete` = 댓글 소프트 삭제(`deleted_reason='moderation'`) + **같은 댓글에 걸린 다른 `pending` 신고도 전부 `actioned`로 일괄 정리** |

### 호출 예시 (SQL 19번 섹션 ⑤)

```sql
CALL sp_create_comment(123, 45, NULL, '이번엔 Yes 갑니다');   -- 원댓글
CALL sp_create_comment(123, 67, 890, '저도 동의해요');        -- 890번 원댓글에 대댓글
CALL sp_toggle_comment_like(890, 45);                         -- 좋아요 토글
CALL sp_delete_comment(890, 67);                              -- 본인(67번) 댓글 소프트 삭제
CALL sp_report_comment(890, 45, 'abuse', '욕설이 포함되어 있습니다');
CALL sp_moderate_comment(5, 1, 'dismiss', '신고 사유 불충분'); -- 5번 신고 기각 (관리자 1번)
CALL sp_moderate_comment(5, 1, 'delete', '욕설 확인, 삭제 조치');
```

---

## 4. 댓글 목록 조회 (SQL 19번 섹션, 참고용 주석)

정렬 3종이 제공되며 모두 같은 구조다.

| 쿼리 | 정렬 기준 |
|---|---|
| ① 최신순 | 원댓글 그룹을 `root.created_at DESC` |
| ② 좋아요순 | 원댓글 `root.like_count DESC`, 동점 시 최신 원댓글 |
| ③ 신용도순 | 원댓글 작성자의 **현재** `credibility_score DESC`, 동점 시 최신 원댓글 |

공통 규칙:

- **스레드 그룹핑**: `JOIN comments root ON root.comment_id = COALESCE(c.parent_comment_id, c.comment_id)` 로 원댓글을 self-join. 1단계 대댓글만 있으므로 **재귀 CTE 불필요**.
- 그룹 정렬 후 그룹 안에서는 `(parent_comment_id IS NOT NULL)` → 원댓글 먼저, 그다음 `c.created_at ASC` (대댓글 오래된 순).
- **삭제된 댓글도 행은 그대로 반환**하되 `content`는 `CASE WHEN is_deleted = 1 THEN NULL` 로 가림. 앱이 "삭제된 댓글입니다"로 렌더링해 스레드가 끊기지 않게 함.
- 작성자 정보(`author_tier`, `author_credibility`, `author_vote_choice`)는 조회 시점에 `users`·`votes` 조인으로 붙임. 작성 자격이 곧 투표 필수라 `votes`는 INNER JOIN으로도 항상 매칭됨.
- ④ 관리자용: `status='pending'` 신고 목록을 댓글 본문·작성자·신고자와 함께, 접수 오래된 순으로 조회. 같은 댓글의 대기 신고 수(`pending_report_count`)도 함께 계산.

---

## 5. 설계 메모

- **`like_count`는 캐시 컬럼**이다. 정렬 성능을 위해 두는 것이고 정확한 수치는 항상 `comment_likes`를 `COUNT`하면 된다. 이 컬럼을 갱신하는 경로는 `sp_toggle_comment_like` 하나뿐이므로, 좋아요를 다른 경로로 넣지 말 것.
- **소프트 삭제**로 스레드 구조를 보존한다. 대댓글이 달린 원댓글이 삭제돼도 행이 남아 있어야 `COALESCE(parent_comment_id, comment_id)` 그룹핑이 깨지지 않는다.
- 작성자의 티어·신용도·Yes/No 태그를 댓글에 **비정규화 저장하지 않는다**. 티어와 점수는 계속 변하므로 "현재값"을 보여주려면 조회 시 조인이 정답이다.
- `sp_moderate_comment`의 `delete` 분기는 대상 댓글에 걸린 **모든 `pending` 신고를 함께 `actioned` 처리**한다. 댓글이 이미 사라졌는데 같은 건에 대한 신고가 검토대기로 남는 것을 막는다.
