# 2026-10-04 · 크루 대항전 스키마 추가

- **대상 DB**: MySQL 8.x
- **SQL 파일**: [`2026-10-04_crew-league.sql`](./2026-10-04_crew-league.sql) (신규 파일)
- **변경 유형**: 추가 — 신규 테이블 3개. 기존 테이블 변경 없음
- **적용 방식**: 백엔드 `predict-spring-1.0` 700e49c 배포 시 `ddl-auto=update`가 자동 생성. SQL은 검토·수동 적용용
- **기준**: Java 엔티티(`Crew`, `UserCrew`, `CrewWeeklyScore`)

## 테이블

| 테이블 | 용도 |
|---|---|
| `crews` | 크루(커뮤니티·학교·팬덤). 관리자만 추가·수정. 삭제 대신 `active=0` |
| `user_crews` | 유저당 현재 크루 1개 + 직전 소속(`previous_crew_id`, `previous_joined_at`) |
| `crew_weekly_scores` | 주간 스냅샷(크루 × 주 1행). `rank` NULL = 집계 중 |

`user_crews.previous_*`는 기획안 스키마에 없던 컬럼이다. "주 중간에 옮긴 사람의 점수는 정산 시점에 소속된
크루로" 규칙을 지키려면 `joined_at` 이전 정산이 어느 크루였는지 알아야 해서 추가했다. 크루 변경은 30일에
한 번이라 한 주 안에서 바뀌는 건 많아야 한 번이고, 직전 소속 하나로 충분하다.

## 규칙(백엔드 `CrewScoreCalculator`)

- 주: 월요일 00:00 ~ 일요일 23:59 (KST)
- 유효 정산: `score_settlements.is_reversed = 0` (정산 결과는 correct/incorrect뿐이라 void는 없다)
- 정산은 `settled_at` 시점에 소속된 크루로 간다 — `joined_at` 이후면 현재 크루, 그 전이면 직전 크루, 그보다 전이면 어디에도 안 감
- 활성 멤버: 그 주 그 크루로 잡힌 유효 정산 3건 이상
- 인원당 점수 = 활성 멤버 `score_delta` 합 / 활성 멤버 수(소수 둘째 자리 반올림). 활성 5명 미만은 순위 없음
- 순위: 인원당 점수 → 활성 인원 → crew_id
- 이번 주는 요청 때 실시간 계산, 지난주부터는 월요일 00:00 배치 스냅샷(없으면 실시간 계산)

## 롤백

```sql
DROP TABLE IF EXISTS crew_weekly_scores;
DROP TABLE IF EXISTS user_crews;
DROP TABLE IF EXISTS crews;
```
