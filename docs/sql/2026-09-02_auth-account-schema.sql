-- =====================================================================
-- 예측 게임 — 인증 / 계정 필수 스키마 추가
-- 대상: MySQL 8.x
-- 선행: 2026-08-29_initial-schema.sql (댓글 17~19번 섹션 포함) 이 먼저 실행되어 있어야 함
-- 구성: 신규 테이블 3개(user_identities, auth_sessions, terms_agreements)
--       + users 컬럼 추가 4건 + 참고 쿼리 모음
--
-- 배경:
--   프론트(lib/auth.ts)는 카카오 OAuth 로그인 → 백엔드가 Bearer 세션 토큰 발급 →
--   /api/auth/me 로 사용자 조회 방식이다. 그런데 기존 스키마에는
--     · 카카오 계정 ↔ users 행을 잇는 매핑
--     · 세션 토큰을 담고 검증/폐기할 자리
--     · 계정 상태(정지/탈퇴) 및 약관 동의 이력
--   이 없다. 이 파일이 그 세 가지 공백만 채운다.
--
--   세션 토큰 검증 방식(서버 저장식 vs 순수 JWT)은 아직 미정이라,
--   서버 저장식(폐기 가능)을 기본으로 설계한다. 순수 JWT로 가더라도
--   auth_sessions 는 그대로 "폐기 목록(revocation list)"으로 재사용 가능하다.
-- =====================================================================


-- =====================================================================
-- 1. user_identities : 소셜 로그인 식별 매핑
--    재로그인한 사용자를 (provider, provider_user_id) 로 기존 users 행에 연결한다.
--    users.signup_channel('kakao' 문자열)은 유입경로 통계용으로 그대로 두고,
--    실제 계정 매칭은 이 테이블이 담당한다.
-- =====================================================================
CREATE TABLE user_identities (
    identity_id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,  -- 식별 매핑 고유 번호(자동 증가)
    user_id             BIGINT UNSIGNED NOT NULL,                    -- 연결된 내부 유저 (users 참조)
    provider            ENUM('kakao') NOT NULL,                      -- 소셜 로그인 제공자. naver/google 등은 나중에 ALTER로 값 추가
    provider_user_id    VARCHAR(255) NOT NULL,                       -- 제공자 측 회원 식별자(카카오 회원번호). 숫자여도 문자열로 보관
    email               VARCHAR(255) NULL,                           -- 제공자가 준 이메일. 선택 동의 항목이라 없을 수 있음
    profile_nickname    VARCHAR(100) NULL,                           -- 제공자 프로필 닉네임 원본 (가입 시 기본 닉네임 참고용)
    profile_image_url   VARCHAR(500) NULL,                           -- 제공자 프로필 이미지 URL
    linked_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 이 소셜 계정이 연결된 시각
    last_login_at       DATETIME NULL,                               -- 이 identity로 마지막 로그인한 시각

    FOREIGN KEY (user_id) REFERENCES users(user_id),
    UNIQUE KEY uq_user_identities_provider_uid (provider, provider_user_id),  -- 재로그인 시 이 키로 기존 유저를 찾음 (핵심)
    UNIQUE KEY uq_user_identities_user_provider (user_id, provider),          -- 한 유저가 같은 provider 계정을 중복 연결 못 하게
    INDEX idx_user_identities_user (user_id)                                  -- 유저의 연결된 소셜 계정 목록 조회
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 2. auth_sessions : 발급된 세션 토큰
--    login_sessions(= "언제 로그인했나" 이력 로그)는 그대로 두고,
--    현재 유효한 토큰은 이 테이블에서 관리한다.
--    토큰 원문은 저장하지 않고 SHA-256 해시만 저장한다 (DB 유출 대비).
-- =====================================================================
CREATE TABLE auth_sessions (
    auth_session_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,      -- 세션 고유 번호(자동 증가)
    user_id         BIGINT UNSIGNED NOT NULL,                        -- 이 토큰의 주인 (users 참조)
    token_hash      CHAR(64) NOT NULL,                               -- 세션 토큰의 SHA-256 hex(64자). 검증 시 조회 키
    issued_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,     -- 토큰 발급 시각
    expires_at      DATETIME NOT NULL,                               -- 만료 시각 (백엔드가 발급 시 계산해서 넣음)
    last_seen_at    DATETIME NULL,                                   -- 이 토큰으로 마지막 요청이 온 시각 (idle timeout·활동 추적)
    revoked_at      DATETIME NULL,                                   -- 폐기 시각. NULL이면 아직 유효
    revoked_reason  ENUM('logout','admin','reissue','expired_cleanup') NULL,
                                                                     -- 폐기 사유 (로그아웃 / 관리자 강제 / 재발급으로 이전 토큰 폐기 / 만료 청소)
    user_agent      VARCHAR(255) NULL,                               -- 발급 요청의 User-Agent (기기 구분 표시용)
    ip_address      VARBINARY(16) NULL,                              -- 발급 요청 IP. INET6_ATON()으로 저장 (IPv4/IPv6 공용)

    FOREIGN KEY (user_id) REFERENCES users(user_id),
    UNIQUE KEY uq_auth_sessions_token (token_hash),                  -- 토큰 해시로 단건 검증 조회
    INDEX idx_auth_sessions_user_revoked (user_id, revoked_at),      -- "내 활성 세션 목록" / 유저 단위 강제 로그아웃
    INDEX idx_auth_sessions_expires (expires_at)                     -- 만료 세션 청소 배치
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 3. 계정 생명주기 + 약관 동의 이력
-- =====================================================================

-- ---------------------------------------------------------------------
-- 3-1. users 계정 상태 컬럼 추가
--      (기존 10번 섹션에서 추가한 role, activity_suppressed 뒤에 이어 붙임)
-- ---------------------------------------------------------------------
ALTER TABLE users
    ADD COLUMN status ENUM('active','suspended','withdrawn') NOT NULL DEFAULT 'active'
        AFTER activity_suppressed,                        -- 계정 상태: 정상 / 정지 / 탈퇴
    ADD COLUMN suspended_until DATETIME NULL AFTER status,-- 정지 만료 시각. 영구정지는 앱 규칙으로 처리(NULL 유지)
    ADD COLUMN withdrawn_at DATETIME NULL AFTER suspended_until,   -- 탈퇴 처리 시각
    ADD COLUMN last_login_at DATETIME NULL AFTER withdrawn_at;     -- 마지막 로그인 시각 (휴면계정 판정용)


-- ---------------------------------------------------------------------
-- 3-2. terms_agreements : 약관 동의 이력
--      한국 서비스 법적 보관 대상. UPDATE 하지 않고 append만 한다
--      (재동의/철회 시 새 행을 쌓아 이력을 보존).
-- ---------------------------------------------------------------------
CREATE TABLE terms_agreements (
    agreement_id    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,      -- 동의 이력 고유 번호(자동 증가)
    user_id         BIGINT UNSIGNED NOT NULL,                        -- 동의한 유저 (users 참조)
    terms_type      ENUM('service','privacy','age_over_14','marketing') NOT NULL,
                                                                     -- 서비스이용약관 / 개인정보처리방침 / 만14세이상 / 마케팅수신
    terms_version   VARCHAR(20) NOT NULL,                            -- 동의한 약관 버전 (예: '2026-09-01')
    is_agreed       TINYINT(1) NOT NULL,                             -- 동의 1 / 비동의·철회 0 (마케팅 등 선택 항목은 나중에 바뀔 수 있음)
    agreed_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,     -- 동의(또는 철회) 기록 시각
    ip_address      VARBINARY(16) NULL,                              -- 동의 시점 IP. INET6_ATON()으로 저장 (분쟁 대비)

    FOREIGN KEY (user_id) REFERENCES users(user_id),
    INDEX idx_terms_agreements_user_type (user_id, terms_type, agreed_at)  -- 유저별 약관종류별 최신 동의 상태 조회
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 4. 참고용 조회 / 배치 쿼리 모음 (주석, 실행 대상 아님)
--    백엔드(Spring Boot)에서 복사해서 사용. 값 바인딩은 ? 로 표기.
-- =====================================================================

-- ① 카카오 로그인 콜백 — 기존 유저인지 먼저 확인
-- SELECT ui.user_id, u.status
-- FROM user_identities ui
-- JOIN users u ON u.user_id = ui.user_id
-- WHERE ui.provider = 'kakao' AND ui.provider_user_id = ?;

-- ② 신규 가입 (①에서 못 찾은 경우) — users → user_identities → 필수 약관 순서로 삽입
-- INSERT INTO users (nickname, signup_channel) VALUES (?, 'kakao');
-- SET @new_user_id = LAST_INSERT_ID();
-- INSERT INTO user_identities (user_id, provider, provider_user_id, email, profile_nickname, profile_image_url, last_login_at)
-- VALUES (@new_user_id, 'kakao', ?, ?, ?, ?, NOW());
-- INSERT INTO terms_agreements (user_id, terms_type, terms_version, is_agreed, ip_address) VALUES
--     (@new_user_id, 'service',     ?, 1, INET6_ATON(?)),
--     (@new_user_id, 'privacy',     ?, 1, INET6_ATON(?)),
--     (@new_user_id, 'age_over_14', ?, 1, INET6_ATON(?)),
--     (@new_user_id, 'marketing',   ?, ?, INET6_ATON(?));   -- 마케팅은 선택 (is_agreed 에 0/1 바인딩)

-- ③ 기존 유저 로그인 — 마지막 로그인 시각 갱신
-- UPDATE user_identities SET last_login_at = NOW()
-- WHERE provider = 'kakao' AND provider_user_id = ?;
-- UPDATE users SET last_login_at = NOW() WHERE user_id = ?;

-- ④ 세션 토큰 발급 (로그인 성공 후) — 토큰 원문은 앱이 생성, DB엔 해시만
-- INSERT INTO auth_sessions (user_id, token_hash, expires_at, user_agent, ip_address)
-- VALUES (?, SHA2(?, 256), ?, ?, INET6_ATON(?));
-- (같은 기기 재발급 정책이면, 삽입 전에 기존 토큰을 폐기:
--  UPDATE auth_sessions SET revoked_at = NOW(), revoked_reason = 'reissue'
--  WHERE user_id = ? AND user_agent = ? AND revoked_at IS NULL;)

-- ⑤ /api/auth/me — 토큰 검증 + 사용자 정보 조회 (모든 인증 요청에서 호출)
-- SELECT u.user_id, u.nickname, u.tier, u.credibility_score, u.role
-- FROM auth_sessions s
-- JOIN users u ON u.user_id = s.user_id
-- WHERE s.token_hash = SHA2(?, 256)
--   AND s.revoked_at IS NULL
--   AND s.expires_at > NOW()
--   AND u.status = 'active';
-- (매칭되면 s.last_seen_at = NOW() 갱신)
-- ※ 순수 JWT 방식으로 전환하면 auth_sessions 조인을 생략하고 토큰 서명만 검증.
--   단 revoked_at IS NULL 확인을 생략하므로 즉시 로그아웃/강제만료는 불가해진다.

-- ⑥ 로그아웃 — 현재 토큰 1건 폐기
-- UPDATE auth_sessions SET revoked_at = NOW(), revoked_reason = 'logout'
-- WHERE token_hash = SHA2(?, 256) AND revoked_at IS NULL;

-- ⑦ 유저 단위 강제 로그아웃 (관리자 조치 / 정지 / 탈퇴 시) — 미폐기 세션 전부 폐기
-- UPDATE auth_sessions SET revoked_at = NOW(), revoked_reason = 'admin'
-- WHERE user_id = ? AND revoked_at IS NULL;

-- ⑧ 만료 세션 청소 크론 (선택) — 폐기 안 된 채 오래 만료된 행 정리
-- UPDATE auth_sessions SET revoked_at = NOW(), revoked_reason = 'expired_cleanup'
-- WHERE revoked_at IS NULL AND expires_at < NOW() - INTERVAL 30 DAY;

-- ⑨ 유저별 현재 약관 동의 상태 (약관종류별 최신 1건)
-- SELECT ta.terms_type, ta.terms_version, ta.is_agreed, ta.agreed_at
-- FROM terms_agreements ta
-- JOIN (
--     SELECT user_id, terms_type, MAX(agreed_at) AS latest_at
--     FROM terms_agreements WHERE user_id = ? GROUP BY user_id, terms_type
-- ) last ON last.user_id = ta.user_id AND last.terms_type = ta.terms_type AND last.latest_at = ta.agreed_at
-- WHERE ta.user_id = ?;


-- =====================================================================
-- 5. 후속(선택) 작업 메모 — 이번 파일 범위에는 넣지 않음
--   · sp_revoke_all_sessions(p_user_id, p_reason) : 정지/탈퇴/역할강등 시 세션 일괄 폐기 프로시저.
--     sp_set_admin_role 등에서 호출하도록 연결 가능. 넣을 경우 DELIMITER // 블록 필요.
--   · sp_withdraw_user(p_user_id) : 탈퇴 처리(status='withdrawn' + 세션 폐기 + 개인정보 컬럼 마스킹).
--     개인정보 파기 정책이 확정되면 구현.
--   · users.nickname 유니크화 : 커뮤니티/리더보드에 사실상 필요. 기존 데이터 중복 정리가 선행되어야 하며,
--     대소문자 무시가 필요하면 nickname_lower 생성컬럼 + UNIQUE 인덱스 방식 권장.
-- =====================================================================
