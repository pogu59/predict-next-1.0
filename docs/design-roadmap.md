# `design/` 반영 조사 기록 및 남은 기능 로드맵

`design/` 폴더(Predict Home / Detail / Login / Mypage / Design Assets, 5개 `.dc.html`)에 그려진 화면을
실제 앱에 반영해달라는 요청을 검토하면서 조사한 내용을 정리한다. 이번 라운드는 **디자인 레이아웃만
기존 화면(이슈 목록/마이페이지/로그인/헤더)에 입히는 것**으로 범위를 확정했고(신규 라우트·백엔드 없음),
디자인에는 있지만 이번에 만들지 않은 기능들의 실제 구현 난이도를 여기 남겨서 다음에 참고할 수 있게 한다.

## 1. 디자인 문서에 있는 것 중 이번에 안 만든 기능

| 기능 | 어느 아트보드 | 필요한 것 |
|---|---|---|
| 이슈 상세 페이지 (`/issue/[id]`) | Detail | 지금 앱엔 상세 라우트 자체가 없음(카드에서 인라인 투표만). 투표 전/후/확정 3상태는 기존 데이터로 충분히 가능 — 신규 라우트만 만들면 됨 (백엔드 불필요) |
| 근거 토론(댓글, 좋아요, 대댓글) | Detail | **DB 스키마·저장 프로시저는 이미 설계됨** — 아래 2절 참고. 백엔드 엔티티/컨트롤러 + 프론트만 없음 |
| 판정 기준 구조화 필드 | Detail | `topics`에 필드 없음. 지금은 `description`을 대체 텍스트로 씀(`lib/issues.ts`의 `toUiIssue`) |
| 비율 추이 차트 | Detail | 시계열 스냅샷 데이터 없음. 신규 테이블 필요 |
| 비슷한 예측 추천 | Detail | 추천 로직 없음 |
| 소수 의견 적중자 랭킹(주제별) | Detail | `score_settlements` 테이블에 유저별 획득 점수가 있어서 특정 토픽 CONFIRMED 시 `ORDER BY score_delta DESC LIMIT 3` 정도로 계산 가능해 보임 — 랭킹/스트릭보다 훨씬 저비용. 확인 필요 |
| 이번 주 랭킹(전체 순위/등락) | Home, Mypage | 완전히 없음. `users.credibility_score` 기준 정렬 쿼리는 만들 수 있지만 "지난주 대비 등락"은 주간 스냅샷이 필요 |
| 참여 스트릭(연속 참여일/최고 스트릭) | Mypage | `votes.voted_at` 또는 `login_sessions.login_at`으로 계산 가능한 원재료는 있으나, 연속일수 계산 로직/엔드포인트 없음 |
| 소속 커뮤니티 | Mypage | `users`에 관련 컬럼 없음. 신규 컬럼 또는 테이블 + 30일 쿨다운 로직 필요 |
| 알림 설정 / 알림벨 실데이터 | Home, Mypage | Notification 엔티티·테이블·컨트롤러 전무 |
| 공유카드 이미지 생성 | Mypage | `share_clicks`는 클릭 로깅(채널, 추천코드)만 함. 이미지 렌더링 기능 없음 |
| 강등 위기 배너 | Mypage | `tier_changes`는 과거 이력만 기록. "이번 주 안에 몇 점 더 필요"는 `sp_confirm_topic_result`/`sp_weekly_activity_check` 안에 하드코딩된 티어 컷오프(500/400/300/200/100)를 애플리케이션 레이어로 꺼내야 계산 가능 |
| 상태별 카운트("전체 16 · 진행 중 4 · 확정 12") | Home | `GET /api/topics`가 무필터 전체 반환만 함. 이번 라운드는 이미 fetch한 목록을 클라이언트에서 세는 걸로 우회 — 데이터량이 커지면 `GET /api/topics/counts` 신규 엔드포인트가 필요해짐 |

## 2. 중요 발견 — 댓글/인증 스키마는 이미 설계돼 있는데 구현이 안 됐음

`docs/sql/`에 이미 두 건의 스키마 설계가 있다.

- **`2026-09-02_comments-feature.md`** — `comments`, `comment_likes`, `comment_reports` 3개 테이블 +
  저장 프로시저 5개(`sp_create_comment`, `sp_toggle_comment_like`, `sp_delete_comment`,
  `sp_report_comment`, `sp_moderate_comment`)까지 SQL로 완성돼 있음. 투표자만 작성 가능, 1단계 대댓글
  제한, 소프트 삭제, 좋아요 캐시 컬럼 등 설계가 꼼꼼함.
- **`2026-09-02_auth-account-schema.md`** — `user_identities`, `auth_sessions`, `terms_agreements`
  3개 테이블 + `users` 컬럼 4건. 지금 백엔드가 쓰는 `login_sessions`/`kakao_id` 방식을 대체하거나
  보완하려는 설계로 보임.

**하지만 둘 다 실제 DB에 적용되어 있지 않고(로컬 `predict-mysql`에 `SHOW TABLES LIKE 'comment%'` /
`'user_identities'` / `'auth_sessions'` 전부 0건), 백엔드 Java 코드에도 대응 엔티티/컨트롤러가
전혀 없다(`find src -iname "*comment*"` 0건).** 즉 **SQL 설계는 끝났지만 한 줄도 구현되지 않은 상태.**

이 때문에 "근거 토론(댓글)"은 이번 조사에서 나온 미구현 기능들 중 **가장 만들기 쉬운 후보**다 — 스키마와
저장 프로시저를 그대로 실행하고, 그 위에 Spring Boot 엔티티/레포지토리/컨트롤러(기존
`TopicController`/`UserController` 패턴 그대로 따라가면 됨) + 프론트 UI만 얹으면 된다. 인증 스키마
쪽은 왜 두 가지 방식(`login_sessions` vs `auth_sessions`+`user_identities`)이 공존하게 설계됐는지
먼저 확인이 필요함 — 마이그레이션 의도인지, 아니면 둘 중 하나가 폐기된 설계인지 다음에 물어봐야 함.

## 3. 백엔드 조사 요약 (`/Users/jhpark/Workspace/predict`)

- 컨트롤러: `TopicController`(`/api/topics`), `AdminTopicController`, `UserController`(`/api/users`),
  `AdminUserController`, `AuthController`(`/api/auth/me`), `CategoryController`.
- 패턴: DTO는 Java record + `from(entity)` 정적 팩토리, `PageResponse<T>` 공용 페이지네이션, 서비스
  레이어 분리(`service/`), 인증은 `CurrentUserService.requireUser`/`requireAdmin`을 각 컨트롤러
  메서드 첫 줄에서 직접 호출(스프링 시큐리티 필터 없음 — `SecurityConfig`는 전체 허용).
- 엔티티는 패키지 루트에 평평하게(`domain`/`entity` 서브패키지 없이) 위치. `enums/`는 DB 값 매핑용
  `dbValue` + `*Converter` 페어.
- `schema/예측게임_schema_8.sql`(백엔드 레포)은 이미 코드보다 뒤처진 문서다 — `Vote`/`TierChange`
  등 일부 필드가 실제 엔티티와 다름. **`docs/sql/`(이 프론트 레포)의 최신 두 파일이 진짜 최신 설계**이고,
  스키마 소스오브트루스는 사실상 Java 엔티티 쪽이니 새 기능 만들 때는 엔티티부터 확인할 것.

## 4. 이번 라운드에서 실제로 한 일 (참고)

- 로컬 `predict-backend` 도커 컨테이너가 옛날 코드(옵션 리스트 대신 yes/no 고정 방식)로 빌드된 채
  떠 있어서 `GET /api/topics` 응답에 `options`가 아예 빠져 있었고, 프론트 `toUiIssue`/`toUiOptions`가
  `undefined.map()`으로 죽는 문제가 있었음 → `docker compose up -d --build backend`로 재빌드해서 해결.
  응답 형태(`options`, `correctOptionId`)가 현재 소스와 일치하는 것 확인함.
- 로컬 카테고리 시드(`정치/스포츠/E스포츠/경제/날씨`)가 비어 있던 것도 이전 세션에서 발견해 채워 넣음.
- **로컬 DB 테이블 자체에도 예전 yes/no 스키마의 잔재 컬럼이 NOT NULL로 남아 있어서 새 토픽
  생성/투표/결과확정이 전부 500 에러였음** — Hibernate `ddl-auto=update`는 컬럼을 추가만 하고
  지우지 않기 때문에, 엔티티가 옵션 리스트 방식으로 바뀐 뒤에도 예전 컬럼이 안 지워진 채 남아있었음.
  발견 즉시 지운 컬럼:
  - `topics.yes_count`, `topics.no_count`, `topics.correct_answer` → 토픽 생성 시 500
  - `votes.choice` → 투표 캐스팅 시 500
  - `score_settlements.choice` → 결과 확정 시 500 (사용자가 실제로 겪기 전에 미리 찾아서 같이 지움)
  전부 `Topic.java`/`Vote.java`/`ScoreSettlement.java` 엔티티에 대응 필드가 없는 걸 확인하고 삭제함.
  이슈 생성 → 투표 → 자동 마감(스케줄러, 60초 주기) → 결과 확정까지 전체 플로우를 실제로 돌려서
  더 이상 안 터지는 것 확인함.
- 위 사고들 모두 "소스코드는 바뀌었는데 로컬 도커 이미지/DB 스키마가 안 따라간" 유형 — 로컬 개발 중
  백엔드 엔티티를 바꿨다면 `docker compose up -d --build`뿐 아니라 **테이블에 안 쓰는 예전 컬럼이
  NOT NULL로 남아있지 않은지**도 같이 확인하는 게 안전함 (`ddl-auto=update`는 컬럼을 절대 안 지움).
