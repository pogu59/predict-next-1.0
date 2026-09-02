# SQL 변경 이력 (docs/sql)

이 폴더는 프로젝트 DB(MySQL 8.x)의 SQL 변경 내역을 개발자가 이해할 수 있도록 정리한 곳이다.
SQL을 **수정 / 추가 / 삭제**할 때마다 여기에 파일 한 쌍을 남긴다.

## 규칙

- 변경 1건당 파일 2개
  - `YYYY-MM-DD_<간단한-설명>.sql` — 실제 실행 SQL (원본, 그대로 실행 가능해야 함)
  - `YYYY-MM-DD_<간단한-설명>.md` — 무엇이 왜 바뀌었는지 설명, 스키마/식/주의사항 정리
- 같은 날 여러 건이면 설명 부분으로 구분 (예: `2026-08-29_add-notification-table.sql`)
- 아래 표에 최신 항목을 위로 추가

## 이력

| 날짜 | 유형 | 내용 | 파일 |
|---|---|---|---|
| 2026-09-02 | 추가 | 인증/계정 필수 스키마 — 신규 테이블 3개(`user_identities`, `auth_sessions`, `terms_agreements`), `users` 컬럼 4건(`status` 등). 카카오 OAuth 매핑·세션 토큰·약관 동의 이력 | [.sql](./2026-09-02_auth-account-schema.sql) · [.md](./2026-09-02_auth-account-schema.md) |
| 2026-09-02 | 추가 | 댓글(커뮤니티) 기능 — 테이블 3개(`comments`, `comment_likes`, `comment_reports`), 저장 프로시저 5개. SQL은 초기 스키마 파일 17~19번 섹션에 이어 붙임 | [.sql](./2026-08-29_initial-schema.sql) (17~19번) · [.md](./2026-09-02_comments-feature.md) |
| 2026-08-29 | 신규 | 예측 게임 초기 스키마 — 테이블 9개, 관리자 컬럼 3건, 저장 프로시저 7개 | [.sql](./2026-08-29_initial-schema.sql) · [.md](./2026-08-29_initial-schema.md) |
