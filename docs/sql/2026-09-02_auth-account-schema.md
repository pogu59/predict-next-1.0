# 2026-09-02 · 인증 / 계정 필수 스키마 추가

- **대상 DB**: MySQL 8.x
- **SQL 파일**: [`2026-09-02_auth-account-schema.sql`](./2026-09-02_auth-account-schema.sql) (신규 파일)
- **변경 유형**: 추가 — 신규 테이블 3개 + `users` 컬럼 4건 + 참고 쿼리 모음
- **선행 조건**: [`2026-08-29_initial-schema.sql`](./2026-08-29_initial-schema.sql) (댓글 17~19번 섹션 포함)이 먼저 실행되어 있어야 함
- **저장 프로시저**: 이번 변경에는 없음 (선택 프로시저는 §6 참고)

---

## 1. 왜 필요한가

프론트(`lib/auth.ts`, `lib/api.ts`) 기준 로그인 흐름:

```
카카오 OAuth  →  백엔드(:8080)가 Bearer 세션 토큰 발급  →  localStorage 저장  →  /api/auth/me 로 사용자 조회
```

기존 스키마(테이블 12개)에는 이 흐름을 DB로 완결시킬 자리가 없었다.

| 공백 | 결과 |
|---|---|
| 카카오 계정 ↔ `users` 행 매핑 없음 | `users.signup_channel='kakao'` 문자열뿐. 재로그인한 사용자를 기존 계정과 못 찾음 |
| 세션 토큰 저장소 없음 | `login_sessions`는 `(user_id, login_at)` 이벤트 로그. 토큰 검증·만료·로그아웃(폐기) 불가 |
| 계정 상태 / 약관 동의 이력 없음 | 정지·탈퇴 구분 불가. 정보통신망법·개인정보보호법상 필요한 약관 동의 기록을 남길 곳 없음 |

이 변경은 위 3가지만 채운다. (알림·유저 제재·감사로그·점수 원장 등 나머지 확장은 이번 범위 밖.)

**세션 토큰 검증 방식(서버 저장식 vs 순수 JWT)은 아직 미정.** 서버 저장식(폐기 가능)을 기본으로
설계했고, 순수 JWT로 가더라도 `auth_sessions`를 그대로 폐기 목록으로 재사용할 수 있다(§3 하단).

---

## 2. 테이블 상세 (SQL 1~3번 섹션)

### 2-1. `user_identities` — 소셜 로그인 식별 매핑 (신규)

| 컬럼 | 설명 |
|---|---|
| `identity_id` | `BIGINT UNSIGNED` AUTO_INCREMENT PK |
| `user_id` | 내부 유저. `users` 참조 |
| `provider` | `ENUM('kakao')` — naver/google 등은 나중에 `ALTER`로 값 추가 |
| `provider_user_id` | 제공자 측 회원 식별자(카카오 회원번호). 숫자여도 `VARCHAR(255)`로 보관 |
| `email` | 제공자가 준 이메일. 선택 동의라 `NULL` 가능 |
| `profile_nickname`, `profile_image_url` | 가입 시 참고용 원본 프로필 |
| `linked_at`, `last_login_at` | 연결 시각 / 이 identity로 마지막 로그인한 시각 |

- **`UNIQUE (provider, provider_user_id)`** — 재로그인 시 이 키로 기존 유저를 찾는다 (핵심)
- **`UNIQUE (user_id, provider)`** — 한 유저가 같은 provider 계정을 중복 연결 못 하게
- `users.signup_channel`은 유입경로 통계용으로 그대로 두고, **실제 계정 매칭은 이 테이블이 담당**

### 2-2. `auth_sessions` — 발급된 세션 토큰 (신규)

`login_sessions`("언제 로그인했나" 이력 로그)는 건드리지 않고, **유효 토큰은 이 테이블에서 관리**.

| 컬럼 | 설명 |
|---|---|
| `auth_session_id` | PK |
| `user_id` | 토큰 주인. `users` 참조 |
| `token_hash` | 세션 토큰의 **SHA-256 hex(`CHAR(64)`)**. 원문은 저장하지 않음 (DB 유출 대비) |
| `issued_at`, `expires_at` | 발급 / 만료 시각 (만료는 백엔드가 발급 시 계산) |
| `last_seen_at` | 이 토큰으로 마지막 요청이 온 시각 (idle timeout·활동 추적) |
| `revoked_at` | 폐기 시각. **`NULL`이면 유효** |
| `revoked_reason` | `ENUM('logout','admin','reissue','expired_cleanup')` |
| `user_agent` | `VARCHAR(255)` — 기기 구분 표시용 |
| `ip_address` | `VARBINARY(16)` — `INET6_ATON()` 저장 (IPv4/IPv6 공용) |

- **`UNIQUE (token_hash)`** — 검증 조회 키
- `INDEX (user_id, revoked_at)` — "내 활성 세션 목록", 유저 단위 강제 로그아웃
- `INDEX (expires_at)` — 만료 세션 청소 배치

### 2-3. `users` 계정 상태 컬럼 (ALTER, 4건)

기존 `role`, `activity_suppressed` 뒤에 추가.

| 컬럼 | 설명 |
|---|---|
| `status` | `ENUM('active','suspended','withdrawn') NOT NULL DEFAULT 'active'` |
| `suspended_until` | `DATETIME NULL` — 정지 만료 시각 (영구정지는 앱 규칙으로 `NULL` 유지) |
| `withdrawn_at` | `DATETIME NULL` — 탈퇴 처리 시각 |
| `last_login_at` | `DATETIME NULL` — 휴면계정 판정용 |

### 2-4. `terms_agreements` — 약관 동의 이력 (신규)

| 컬럼 | 설명 |
|---|---|
| `agreement_id` | PK |
| `user_id` | `users` 참조 |
| `terms_type` | `ENUM('service','privacy','age_over_14','marketing')` — 서비스약관 / 개인정보 / 만14세이상 / 마케팅수신 |
| `terms_version` | `VARCHAR(20)` — 동의한 약관 버전 (예: `'2026-09-01'`) |
| `is_agreed` | `TINYINT(1)` — 동의 1 / 비동의·철회 0 |
| `agreed_at` | `DATETIME` 기본 `CURRENT_TIMESTAMP` |
| `ip_address` | `VARBINARY(16) NULL` — 동의 시점 IP (분쟁 대비) |

- `INDEX (user_id, terms_type, agreed_at)` — 유저별 약관종류별 최신 동의 상태 조회
- **`UPDATE` 하지 않고 `append`만** 한다. 재동의/철회 시 새 행을 쌓아 이력을 보존
- 필수 약관(`service`, `privacy`, `age_over_14`)은 가입 시 1행씩, `marketing`은 선택

---

## 3. 로그인 흐름과 참고 쿼리 (SQL 4번 섹션)

SQL 파일 하단에 백엔드가 복사해 쓸 쿼리 9종이 주석으로 정리되어 있다.

| 번호 | 용도 |
|---|---|
| ① | 카카오 콜백 — `(provider, provider_user_id)`로 기존 유저 확인 |
| ② | 신규 가입 — `users` → `user_identities` → 필수 `terms_agreements` 순서로 삽입 |
| ③ | 기존 유저 로그인 — `last_login_at` 갱신 |
| ④ | 세션 토큰 발급 — DB엔 `SHA2(token, 256)` 해시만 저장 |
| ⑤ | `/api/auth/me` — `token_hash` 조인 + `revoked_at IS NULL AND expires_at > NOW()` + `status='active'` |
| ⑥ | 로그아웃 — 해당 토큰 1건 `revoked` |
| ⑦ | 유저 단위 강제 로그아웃 (관리자·정지·탈퇴) — 미폐기 세션 전부 `revoked` |
| ⑧ | 만료 세션 청소 크론 (선택) |
| ⑨ | 유저별 현재 약관 동의 상태 (약관종류별 최신 1건) |

### 순수 JWT로 전환할 경우

⑤에서 `auth_sessions` 조인을 생략하고 **토큰 서명만 검증**하면 된다. 스키마 변경은 불필요하고,
`auth_sessions`는 여전히 발급 로그 + 폐기 목록으로 유지 가능하다.
단 `revoked_at` 확인을 생략하므로 **즉시 로그아웃·강제만료가 불가**해진다(토큰 만료까지 유효).

---

## 4. 기존 객체 영향

- **없음 (추가만).** 기존 12개 테이블 DDL과 프로시저 10개(5+5)는 변경하지 않았다.
- `users`에는 컬럼 4건만 `ADD COLUMN` — 기존 행은 `status='active'`, 나머지는 `NULL`로 채워진다.
- **`sp_correct_topic_result`의 점수 replay 로직: 영향 없음.** 이번 변경은 `credibility_score`를
  움직이는 새 경로를 만들지 않는다.

---

## 5. 실행 / 검증

```
2026-08-29_initial-schema.sql   (댓글 17~19번 포함)
        ↓
2026-09-02_auth-account-schema.sql
```

1. 깨끗한 MySQL 8 스키마에 위 순서로 실행 — 에러 없이 완료되는지 확인
2. 구조 확인: `SHOW CREATE TABLE user_identities;` / `... auth_sessions;` / `... terms_agreements;`,
   `DESCRIBE users;` (status·suspended_until·withdrawn_at·last_login_at 추가 확인)
3. 스모크 테스트
   - `users` 1행 + `user_identities` 1행(`provider='kakao'`) 삽입 → 성공
   - 같은 `(provider, provider_user_id)`로 2번째 삽입 → **UNIQUE 위반** 실패(정상)
   - `auth_sessions` 1행 삽입 후 ⑤ me 쿼리 → 유저 정보 1행 반환
   - 같은 세션에 `revoked_at = NOW()` → ⑤ me 쿼리 결과 0행
   - `terms_agreements`에 `service`/`privacy`/`age_over_14` 3행 삽입 → 성공
   - 존재하지 않는 `user_id`로 각 테이블 삽입 → **FK 위반** 실패

---

## 6. 후속(선택) 작업

이번 파일에는 넣지 않았다. 필요 시 별도 변경으로 추가.

- **`sp_revoke_all_sessions(p_user_id, p_reason)`** — 정지/탈퇴/역할강등 시 세션 일괄 폐기 프로시저.
  `sp_set_admin_role` 등에서 호출하도록 연결
- **`sp_withdraw_user(p_user_id)`** — 탈퇴 처리(상태 변경 + 세션 폐기 + 개인정보 컬럼 마스킹).
  개인정보 파기 정책 확정 후 구현
- **`users.nickname` 유니크화** — 커뮤니티/리더보드에 사실상 필요. 기존 데이터 중복 정리가 선행.
  대소문자 무시가 필요하면 `nickname_lower` 생성컬럼 + `UNIQUE` 인덱스 방식 권장
- 그 외 검토됐으나 보류: 알림(`notifications`), 유저 제재(`user_sanctions`), 관리자 감사로그,
  신용도 가감 원장(출석·추천·이벤트 보상), 배치 실행 로그, 앱 설정 테이블
