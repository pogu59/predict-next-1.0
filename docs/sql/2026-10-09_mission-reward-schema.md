# 2026-10-09 · 미션 · 리워드 포인트 스키마 추가

- **대상 DB**: MySQL 8.x
- **SQL 파일**: [`2026-10-09_mission-reward-schema.sql`](./2026-10-09_mission-reward-schema.sql) (신규 파일)
- **원본**: 백엔드 레포 `predict-spring-1.0`의 `schema/2026-10-09_mission-reward.sql`(브랜치 `feat/mission-reward`)과 같은 내용이다. 둘 중 하나를 고치면 다른 쪽도 맞춘다.
- **변경 유형**: 추가 — 신규 테이블 6개. 기존 테이블은 바꾸지 않는다.
- **선행 조건**: `users` 테이블이 있어야 한다. 운영 `users.user_id`는 Hibernate가 만든 부호 있는 `BIGINT`라서, 이를 가리키는 `user_id`·`handled_by`도 `BIGINT`(UNSIGNED 아님)로 둔다.
- **실행 시점**: 백엔드가 `spring.jpa.hibernate.ddl-auto=none`이라, 미션 기능을 배포하기 **전에** 직접 실행해야 한다.
- **저장 프로시저**: 없음

---

## 1. 왜 필요한가

참여자가 미션(출석 · 밸런스 게임 · 설문)을 하고 **리워드 포인트**를 받아 기프티콘으로 바꾸는 기능(앱테크)을 붙인다.
프론트 화면은 `/mission`, `/mission/[id]`, `/my/wallet`, 관리자 `/admin/missions`, `/admin/exchanges`.

**신용도와 리워드 포인트는 완전히 분리한다.**

| | 신용도 (`users.credibility_score`) | 리워드 포인트 (`reward_wallets.balance`) |
|---|---|---|
| 얻는 방법 | 예측 적중 | 미션 검수 통과 · 오늘의 미션 보너스 |
| 쓰는 곳 | 예측에 걸기 | 기프티콘 교환 신청 |
| 현금 가치 | 없음 | 교환 상품으로만 |

두 값 사이의 전환 경로(테이블·프로시저·API)는 만들지 않는다. 예측에 건 값이 경품으로 이어지면
사행성 문제가 생기기 때문이다. 그래서 `users`에 컬럼을 더하지 않고 지갑을 따로 둔다
(유저 행 잠금 경합도 피한다).

---

## 2. 테이블

| 테이블 | 역할 | 핵심 제약 |
|---|---|---|
| `missions` | 미션 한 건(유형·보상·기간·상태) | `status`: draft → open ↔ closed. 공개 기간 `[starts_at, ends_at)` |
| `mission_questions` | 객관식 문항(보기 2~6개, 줄바꿈 구분) | `(mission_id, sort_order)` UNIQUE. `attention_answer_index`는 확인 문항 정답 — 참여자 API에 노출하지 않음 |
| `mission_submissions` | 제출 + 규칙 검수 결과 | `(mission_id, user_id, submitted_on)` UNIQUE — 출석은 하루 1회, 나머지는 서비스에서 미션당 1회 |
| `reward_wallets` | 유저당 포인트 잔액 1행 | `version`으로 낙관적 락. 잔액 0 미만 불가 |
| `reward_exchange_requests` | 기프티콘 교환 신청(수동 승인) | 신청 시점 상품명·포인트를 복사해 둠 |
| `reward_transactions` | 포인트 원장(추가만) | `idempotency_key` UNIQUE — 같은 적립·환불이 두 번 기록되지 않음 |

`idempotency_key` 예: `earn:submission:42`, `bonus:daily:7:2026-10-09`, `exchange:15`, `refund:15`.

---

## 3. 흐름

```
미션 제출 → 검수(QualityPolicy v0) ─ 통과 → 원장 earn(+) → 지갑 잔액 증가
                                   └ 반려 → 제출 기록만 남음(사유를 참여자에게 보여 줌)
오늘의 미션(출석 제외) 모두 통과 → 원장 bonus(+30)

교환 신청 → 원장 exchange(−) 즉시 차감 → 운영자 확인
    ├ 발송 완료(sent)
    └ 반려(rejected) / 참여자 취소(canceled) → 원장 refund(+) 환불
```

검수 v0 규칙: 확인 문항 오답 → 반려, 문항당 최소 시간(설문 1.5초, 밸런스 0.7초) 미만 → 반려,
빠른 편·일자형 응답은 점수(`quality_score`)만 깎는다.

---

## 4. 주의사항

- **기프티콘을 받을 번호(본인인증)는 아직 저장하지 않는다.** 실제로 발송을 시작하기 전에 본인인증 연동과
  받는 번호 컬럼(또는 별도 테이블)이 필요하다. 그 전까지 운영자는 발송 전에 연락처를 따로 확인해야 한다.
- 교환 상품 목록은 백엔드 `RewardCatalog`에 임시로 고정되어 있다(아이스크림 1,000P · 편의점 3,000P ·
  커피 4,500P · 베이커리 5,000P). 신청 기록에 이름·포인트를 복사하므로 나중에 상품 테이블로 옮겨도 과거 기록은 그대로다.
- 원장(`reward_transactions`)은 수정·삭제하지 않는다. 잘못 들어간 값은 `adjust` 유형의 반대 기록으로 바로잡는다(이 작업을 하는 관리 화면·API는 아직 없다).
- 파일 끝에 확인용 예시 미션 INSERT가 주석으로 들어 있다.
