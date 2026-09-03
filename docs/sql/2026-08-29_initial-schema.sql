-- =====================================================================
-- 예측 게임 프로젝트 — MySQL 스키마 (전체 9개 테이블)
-- 대상: MySQL 8.x (HeidiSQL로 작업)
-- 작성 기준: 카테고리 5개 / 신용도 점수 시스템 / 티어 시스템 / 이벤트 로깅 스펙
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. categories : 카테고리 5개 고정값 (유저가 추가/삭제하지 않음)
-- ---------------------------------------------------------------------
CREATE TABLE categories (
    category_id     TINYINT UNSIGNED PRIMARY KEY,   -- 카테고리 번호(1~5). 작은 정수라 TINYINT로 용량 절약
    name            VARCHAR(30) NOT NULL UNIQUE      -- 카테고리명. UNIQUE라 이름 중복 불가
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO categories (category_id, name) VALUES
    (1, '정치'), (2, '스포츠'), (3, 'E스포츠'), (4, '경제'), (5, '날씨');


-- ---------------------------------------------------------------------
-- 2. users : 유저 정보 + 누적 신용도 점수 + 현재 티어
-- ---------------------------------------------------------------------
CREATE TABLE users (
    user_id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,  -- 유저 고유 번호(자동 증가)
    nickname            VARCHAR(50) NOT NULL,                        -- 닉네임
    signup_channel      VARCHAR(50) NULL,                            -- 유입경로(예: direct, kakao 등). 알 수 없으면 NULL
    referred_by_code    VARCHAR(20) NULL,                            -- 가입 시 사용한 추천 코드 (share_clicks.referral_code 참조, 없으면 NULL)
    credibility_score   INT NOT NULL DEFAULT 0,                      -- 누적 신용도 점수. 하한 0은 애플리케이션 레벨에서 강제
    tier                VARCHAR(20) NOT NULL DEFAULT '언랭크',        -- 현재 티어. 가입 직후 자동으로 '언랭크'
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP  -- 가입일시(자동 기록)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------
-- 3. topics : 투표 주제
-- ---------------------------------------------------------------------
CREATE TABLE topics (
    topic_id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id         TINYINT UNSIGNED NOT NULL,                   -- 소속 카테고리 (categories 참조)
    title               VARCHAR(255) NOT NULL,                       -- 주제 제목
    description         TEXT NULL,                                   -- 부가 설명 (없어도 됨)
    status              ENUM('open','pending_result','confirmed','void')
                             NOT NULL DEFAULT 'open',
                             -- open=투표중 / pending_result=결과대기 / confirmed=확정 / void=무효
    vote_start_at       DATETIME NOT NULL,                           -- 투표 시작 시각
    vote_deadline_at    DATETIME NOT NULL,                           -- 투표 마감 시각
    confirmed_at        DATETIME NULL,                               -- 결과 확정 시각 (미확정이면 NULL)
    correct_answer      ENUM('yes','no') NULL,                       -- 정답 (void면 NULL 유지)
    yes_count           INT UNSIGNED NOT NULL DEFAULT 0,             -- 마감 시점 Yes 득표수 (점수 계산용 스냅샷)
    no_count            INT UNSIGNED NOT NULL DEFAULT 0,             -- 마감 시점 No 득표수
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 주제 생성 시각

    FOREIGN KEY (category_id) REFERENCES categories(category_id),
    INDEX idx_topics_category_status (category_id, status),          -- "카테고리별 특정 상태" 조회 최적화
    INDEX idx_topics_deadline (vote_deadline_at)                     -- 마감시각 기준 조회/배치 처리 최적화
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------
-- 4. votes : 투표 참여 기록
-- ---------------------------------------------------------------------
CREATE TABLE votes (
    vote_id     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT UNSIGNED NOT NULL,
    topic_id    BIGINT UNSIGNED NOT NULL,
    choice      ENUM('yes','no') NOT NULL,                           -- 유저의 선택
    voted_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,         -- 투표 시각

    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (topic_id) REFERENCES topics(topic_id),
    UNIQUE KEY uq_votes_user_topic (user_id, topic_id),              -- 유저당 주제 1표만 (중복 투표 원천 차단)
    INDEX idx_votes_topic (topic_id),                                -- 특정 주제의 참여자 조회(정산 시 사용)
    INDEX idx_votes_user_time (user_id, voted_at)                    -- 유저별 시간순 조회(주간 참여횟수 집계용)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------
-- 5. score_settlements : 점수 정산 결과 (votes와 1:1)
-- ---------------------------------------------------------------------
CREATE TABLE score_settlements (
    settlement_id   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    vote_id         BIGINT UNSIGNED NOT NULL,                        -- 정정 시 같은 투표에 재정산 레코드가 또 생길 수 있어 UNIQUE 아님
    user_id         BIGINT UNSIGNED NOT NULL,
    topic_id        BIGINT UNSIGNED NOT NULL,
    choice          ENUM('yes','no') NOT NULL,                       -- votes에서 복사 (조회 편의용)
    result          ENUM('correct','incorrect','void') NOT NULL,     -- 정답/오답/무효
    p_value         DECIMAL(5,4) NOT NULL,                           -- 득표비율 p (예: 0.5384). 반올림 오차 없는 DECIMAL 사용
    score_delta     INT NOT NULL,                                    -- 이번 정산으로 발생한 점수 변동분(+/-)
    score_after     INT NOT NULL,                                    -- 정산 직후 누적 신용도 점수 스냅샷
    is_reversed     TINYINT(1) NOT NULL DEFAULT 0,                   -- 오확정 정정으로 무효화된 기록인지 (1=무효, 삭제하지 않고 감사기록 보존)
    settled_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,     -- 정산 실행 시각

    FOREIGN KEY (vote_id) REFERENCES votes(vote_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (topic_id) REFERENCES topics(topic_id),
    INDEX idx_settlements_vote (vote_id),                            -- 정정 후 재정산 시 같은 vote_id로 여러 건 존재 가능
    INDEX idx_settlements_user (user_id),                            -- 유저별 정산 이력 조회(정답률 분석 등)
    INDEX idx_settlements_topic (topic_id)                           -- 주제별 정산 결과 조회
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------
-- 6. tier_changes : 티어 변경 이력
-- ---------------------------------------------------------------------
CREATE TABLE tier_changes (
    tier_change_id  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL,
    previous_tier   VARCHAR(20) NOT NULL,
    new_tier        VARCHAR(20) NOT NULL,
    reason          ENUM('score_based','activity_based','correction') NOT NULL,
                         -- score_based = 정답/오답 정산 시마다 점수 변동에 따른 자연스러운 티어 변경
                         -- activity_based = 다이아·마스터 대상 주간 참여 5회 체크로 인한 변경
                         -- correction = 관리자의 오확정 정정으로 인한 재계산 결과 변경
                         -- 승급/강등 방향은 previous_tier와 new_tier를 비교하면 항상 알 수 있으므로 별도 저장 안 함
    snapshot_id     BIGINT UNSIGNED NULL,                            -- activity_* 사유일 때만 채움 (아래 9번 테이블 참조)
    changed_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id),
    -- snapshot_id의 FOREIGN KEY는 weekly_activity_snapshots 테이블이 아직 생성되기 전이라
    -- 여기서 바로 걸 수 없음. 파일 맨 아래에서 ALTER TABLE로 나중에 추가함
    INDEX idx_tier_changes_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------
-- 7. share_clicks : 공유 버튼 클릭 로그
-- ---------------------------------------------------------------------
CREATE TABLE share_clicks (
    share_click_id  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL,                        -- 공유한 유저
    channel         VARCHAR(30) NOT NULL,                            -- 공유 채널(카톡/X 등)
    referral_code   VARCHAR(20) NOT NULL UNIQUE,                     -- 이 공유 클릭 고유의 추천 코드 (링크에 심어서 배포)
    clicked_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------
-- 8. login_sessions : 로그인 기록
-- ---------------------------------------------------------------------
CREATE TABLE login_sessions (
    session_id  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT UNSIGNED NOT NULL,
    login_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------
-- 9. weekly_activity_snapshots : 다이아/마스터 주간 활동성 체크 스냅샷
--    (매주 일요일 자정 배치가 계산한 결과를 그대로 영구 저장)
-- ---------------------------------------------------------------------
CREATE TABLE weekly_activity_snapshots (
    snapshot_id     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL,
    week_start      DATE NOT NULL,                                   -- 해당 주 월요일 날짜
    week_end        DATE NOT NULL,                                   -- 해당 주 일요일 날짜
    vote_count      INT UNSIGNED NOT NULL,                           -- 그 주 실제 투표 횟수 (계산 당시 값 고정)
    met_requirement TINYINT(1) NOT NULL,                             -- 5회 조건 충족 여부 (1=충족, 0=미충족)
    tier_before     VARCHAR(20) NOT NULL,                            -- 체크 직전 티어
    tier_after      VARCHAR(20) NOT NULL,                            -- 체크 직후 티어
    checked_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id),
    UNIQUE KEY uq_snapshot_user_week (user_id, week_start)           -- 유저당 주 하나에 기록 하나만
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- weekly_activity_snapshots 생성이 끝난 뒤, tier_changes.snapshot_id에 FK를 추가
-- (6번 테이블 생성 시점엔 9번 테이블이 없어서 미리 걸 수 없었기 때문에 여기서 추가)
-- ---------------------------------------------------------------------
ALTER TABLE tier_changes
    ADD FOREIGN KEY (snapshot_id) REFERENCES weekly_activity_snapshots(snapshot_id);

-- ---------------------------------------------------------------------
-- share_clicks 생성이 끝난 뒤, users.referred_by_code에 FK를 추가
-- (2번 테이블 생성 시점엔 7번 테이블이 없어서 미리 걸 수 없었기 때문에 여기서 추가)
-- 신규가입이 항상 공유 링크를 통하는 건 아니므로 NULL 허용 유지
-- ---------------------------------------------------------------------
ALTER TABLE users
    ADD FOREIGN KEY (referred_by_code) REFERENCES share_clicks(referral_code),
    ADD INDEX idx_users_referred_by (referred_by_code);


-- =====================================================================
-- 10. 관리자 페이지 지원 — 스키마 추가
-- =====================================================================

-- 관리자 구분 (관리자 페이지 접근 권한 체크용)
ALTER TABLE users
    ADD COLUMN role ENUM('user','admin') NOT NULL DEFAULT 'user';

-- 다이아/마스터 활동성 강등 상태 표시 (1이면 점수가 충분해도 실시간 정산으론 다이아/마스터 복귀 안 됨)
ALTER TABLE users
    ADD COLUMN activity_suppressed TINYINT(1) NOT NULL DEFAULT 0;

-- 누가 이 결과를 확정했는지 기록 (책임 소재 추적용)
ALTER TABLE topics
    ADD COLUMN confirmed_by BIGINT UNSIGNED NULL,
    ADD FOREIGN KEY (confirmed_by) REFERENCES users(user_id);


-- =====================================================================
-- 11. 결과 확정 저장 프로시저
--     관리자 페이지에서 "Yes/No/무효" 버튼 클릭 시 이 프로시저 하나만 호출하면
--     득표 확정 → 점수 정산 → credibility_score 갱신 → 티어 재계산 → 로그 기록까지 전부 처리됨.
--     reason은 항상 'score_based'만 기록 — 승급/강등 방향은 저장하지 않고,
--     필요할 때 previous_tier/new_tier를 비교해서 계산하면 됨 (중복 정보 저장 방지)
-- =====================================================================
DELIMITER //

CREATE PROCEDURE sp_confirm_topic_result(
    IN p_topic_id BIGINT UNSIGNED,
    IN p_answer VARCHAR(10),      -- 'yes', 'no', 'void' 중 하나
    IN p_admin_id BIGINT UNSIGNED
)
BEGIN
    DECLARE v_yes_count INT UNSIGNED;
    DECLARE v_no_count INT UNSIGNED;
    DECLARE v_status VARCHAR(20);

    -- 예외 발생 시 자동 롤백 (트랜잭션 중간 실패로 인한 데이터 불일치 방지)
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- ⚠️ 안전장치: 이미 confirmed/void 처리된 주제에 재실행되면 중복 정산이 쌓여
    --    점수가 두 배로 계산되는 심각한 버그가 생기므로, open/pending_result일 때만 허용
    --    (이미 확정된 걸 다시 처리하려면 sp_correct_topic_result로 먼저 무효화한 뒤 재호출해야 함)
    SELECT status INTO v_status FROM topics WHERE topic_id = p_topic_id;

    IF v_status NOT IN ('open', 'pending_result') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = '이미 확정되었거나 무효 처리된 주제입니다. 다시 처리하려면 sp_correct_topic_result를 먼저 호출하세요.';
    END IF;

    START TRANSACTION;

    -- 1. 마감 시점 득표수 확정해서 topics에 반영
    SELECT
        COUNT(CASE WHEN choice='yes' THEN 1 END),
        COUNT(CASE WHEN choice='no' THEN 1 END)
    INTO v_yes_count, v_no_count
    FROM votes WHERE topic_id = p_topic_id;

    UPDATE topics
    SET status = IF(p_answer = 'void', 'void', 'confirmed'),
        correct_answer = IF(p_answer = 'void', NULL, p_answer),
        confirmed_at = NOW(),
        confirmed_by = p_admin_id,
        yes_count = v_yes_count,
        no_count = v_no_count
    WHERE topic_id = p_topic_id;

    -- 2. 무효 처리라면 정산 없이 종료 (점수 변동 없음, void 상태만 로그)
    IF p_answer = 'void' THEN
        INSERT INTO score_settlements (vote_id, user_id, topic_id, choice, result, p_value, score_delta, score_after)
        SELECT v.vote_id, v.user_id, v.topic_id, v.choice, 'void', 0.5, 0, u.credibility_score
        FROM votes v JOIN users u ON v.user_id = u.user_id
        WHERE v.topic_id = p_topic_id;

        COMMIT;
    ELSE
        -- 3. p값·보너스·점수변동·정산후점수를 임시테이블에 한 번만 계산해서 재사용
        --    (이전 버전은 같은 계산을 여러 번 반복해서 실수 여지가 컸음 — 여기서 정리)
        DROP TEMPORARY TABLE IF EXISTS tmp_settlement;
        CREATE TEMPORARY TABLE tmp_settlement AS
        SELECT
            v.vote_id, v.user_id, v.topic_id, v.choice,
            CASE WHEN v.choice = p_answer THEN 'correct' ELSE 'incorrect' END AS result,
            ROUND(CASE WHEN v.choice='yes' THEN (v_yes_count+5)/(v_yes_count+v_no_count+10)
                       ELSE (v_no_count+5)/(v_yes_count+v_no_count+10) END, 4) AS p_value,
            u.credibility_score AS score_before
        FROM votes v JOIN users u ON v.user_id = u.user_id
        WHERE v.topic_id = p_topic_id;

        ALTER TABLE tmp_settlement ADD COLUMN bonus DECIMAL(6,4);
        UPDATE tmp_settlement SET bonus = 2 * (1 - 4 * POW(p_value - 0.5, 2));

        ALTER TABLE tmp_settlement ADD COLUMN score_delta INT;
        UPDATE tmp_settlement
        SET score_delta = CASE
            WHEN result = 'correct' THEN ROUND(40 * (1 - p_value) + bonus)
            ELSE ROUND(-(40 * p_value - bonus))
        END;

        ALTER TABLE tmp_settlement ADD COLUMN score_after INT;
        UPDATE tmp_settlement SET score_after = GREATEST(0, score_before + score_delta);

        -- 4. score_settlements 저장
        INSERT INTO score_settlements (vote_id, user_id, topic_id, choice, result, p_value, score_delta, score_after)
        SELECT vote_id, user_id, topic_id, choice, result, p_value, score_delta, score_after
        FROM tmp_settlement;

        -- 5. credibility_score 갱신
        UPDATE users u
        JOIN tmp_settlement t ON t.user_id = u.user_id
        SET u.credibility_score = t.score_after;

        -- 6. 티어 재계산 — activity_suppressed=1인 유저는 점수가 충분해도 플래티넘까지만 허용
        --    (다이아/마스터로의 실시간 복귀는 오직 주간 활동성 체크만 할 수 있음)
        DROP TEMPORARY TABLE IF EXISTS tmp_tier;
        CREATE TEMPORARY TABLE tmp_tier AS
        SELECT
            u.user_id, u.tier AS old_tier,
            (CASE
                WHEN u.credibility_score >= 500 AND u.activity_suppressed = 0 THEN '마스터'
                WHEN u.credibility_score >= 500 AND u.activity_suppressed = 1 THEN '플래티넘'
                WHEN u.credibility_score >= 400 AND u.activity_suppressed = 0 THEN '다이아'
                WHEN u.credibility_score >= 400 AND u.activity_suppressed = 1 THEN '플래티넘'
                WHEN u.credibility_score >= 300 THEN '플래티넘'
                WHEN u.credibility_score >= 200 THEN '골드'
                WHEN u.credibility_score >= 100 THEN '실버'
                WHEN u.credibility_score >= 1   THEN '브론즈'
                ELSE '언랭크'
            END) COLLATE utf8mb4_unicode_ci AS new_tier
            -- ⚠️ COLLATE 명시 필수: CASE로 만든 문자열은 MySQL 8 기본값(utf8mb4_0900_ai_ci)을 갖게 되어
            --    테이블의 utf8mb4_unicode_ci 컬럼(old_tier)과 비교 시 "Illegal mix of collations" 에러 발생
        FROM users u
        WHERE u.user_id IN (SELECT user_id FROM tmp_settlement);

        -- 7. 실제로 티어가 바뀐 유저만 로그 기록
        INSERT INTO tier_changes (user_id, previous_tier, new_tier, reason)
        SELECT user_id, old_tier, new_tier, 'score_based'
        FROM tmp_tier WHERE old_tier != new_tier;

        -- 8. users.tier 반영
        UPDATE users u
        JOIN tmp_tier t ON t.user_id = u.user_id
        SET u.tier = t.new_tier
        WHERE u.tier != t.new_tier;

        DROP TEMPORARY TABLE IF EXISTS tmp_settlement;
        DROP TEMPORARY TABLE IF EXISTS tmp_tier;

        COMMIT;
    END IF;
END //

DELIMITER ;


-- =====================================================================
-- 12. 주간 활동성 체크 프로시저 (다이아/마스터 전용)
--     매주 일요일 자정(KST)에 실행. 그 주 참여횟수 5회 미만이면 표시 강등 +
--     activity_suppressed=1 설정. 5회 이상 채우면 점수 기준 티어로 복귀 +
--     activity_suppressed=0으로 해제.
--     credibility_score >= 400(다이아 이상 자격)인 유저 전원을 대상으로 하며,
--     현재 표시 티어가 이미 강등되어 있어도(플래티넘 표시 중이어도) 자격 기준은
--     항상 credibility_score로 판단 — 그래야 "숨겨진 자격자"도 정확히 체크됨
-- =====================================================================
DELIMITER //

CREATE PROCEDURE sp_weekly_activity_check(
    IN p_week_start DATE,   -- 그 주의 월요일 날짜
    IN p_week_end DATE      -- 그 주의 일요일 날짜
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    DROP TEMPORARY TABLE IF EXISTS tmp_check;
    CREATE TEMPORARY TABLE tmp_check AS
    SELECT
        u.user_id,
        u.tier AS current_display_tier,
        (CASE
            WHEN u.credibility_score >= 500 THEN '마스터'
            WHEN u.credibility_score >= 400 THEN '다이아'
        END) COLLATE utf8mb4_unicode_ci AS score_based_tier,
        -- ⚠️ COLLATE 명시 필수 (sp_confirm_topic_result와 동일한 이유)
        COALESCE(v.vote_count, 0) AS vote_count
    FROM users u
    LEFT JOIN (
        SELECT user_id, COUNT(*) AS vote_count
        FROM votes
        WHERE voted_at >= p_week_start AND voted_at < DATE_ADD(p_week_end, INTERVAL 1 DAY)
        GROUP BY user_id
    ) v ON v.user_id = u.user_id
    WHERE u.credibility_score >= 400;   -- 다이아 이상 자격자 전원 (표시 티어와 무관)

    -- 스냅샷 기록 (통과/실패 모두, 매주 영구 보존)
    INSERT INTO weekly_activity_snapshots
        (user_id, week_start, week_end, vote_count, met_requirement, tier_before, tier_after)
    SELECT
        user_id, p_week_start, p_week_end, vote_count,
        IF(vote_count >= 5, 1, 0),
        current_display_tier,
        CASE
            WHEN vote_count >= 5 THEN score_based_tier
            ELSE CASE score_based_tier WHEN '마스터' THEN '다이아' WHEN '다이아' THEN '플래티넘' END
        END
    FROM tmp_check;

    -- tier_changes 로그 (실제 표시 티어가 바뀌는 경우만)
    INSERT INTO tier_changes (user_id, previous_tier, new_tier, reason, snapshot_id)
    SELECT
        t.user_id, t.current_display_tier, s.tier_after, 'activity_based', s.snapshot_id
    FROM tmp_check t
    JOIN weekly_activity_snapshots s
        ON s.user_id = t.user_id AND s.week_start = p_week_start
    WHERE t.current_display_tier != s.tier_after;

    -- users.tier + activity_suppressed 플래그 갱신
    UPDATE users u
    JOIN tmp_check t ON t.user_id = u.user_id
    SET
        u.tier = IF(t.vote_count >= 5, t.score_based_tier,
                    CASE t.score_based_tier WHEN '마스터' THEN '다이아' WHEN '다이아' THEN '플래티넘' END),
        u.activity_suppressed = IF(t.vote_count >= 5, 0, 1);

    DROP TEMPORARY TABLE IF EXISTS tmp_check;

    COMMIT;
END //

DELIMITER ;


-- =====================================================================
-- 13. 오확정 정정 프로시저
--     관리자가 잘못된 답으로 확정한 걸 발견했을 때 호출.
--     기존 정산 기록은 삭제하지 않고 무효 표시만 하고(감사기록 보존),
--     영향받은 유저의 점수를 남은 정산 기록만으로 시간순 재생(replay)하여
--     0점 하한선까지 정확히 재현. 이후 주제는 '결과대기'로 되돌아가
--     sp_confirm_topic_result를 올바른 정답으로 다시 호출하면 재정산됨.
-- =====================================================================
DELIMITER //

CREATE PROCEDURE sp_correct_topic_result(
    IN p_topic_id BIGINT UNSIGNED
)
BEGIN
    DECLARE v_status VARCHAR(20);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SELECT status INTO v_status FROM topics WHERE topic_id = p_topic_id;

    IF v_status NOT IN ('confirmed', 'void') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = '이 주제는 아직 확정되지 않아 정정할 수 없습니다.';
    END IF;

    START TRANSACTION;

    -- 1. 이 주제의 기존 정산을 '무효'로 표시 (삭제 안 함 — 실수 기록도 감사용으로 보존)
    UPDATE score_settlements
    SET is_reversed = 1
    WHERE topic_id = p_topic_id AND is_reversed = 0;

    -- 2. 주제를 다시 결과대기 상태로 되돌려 재확정 가능하게 함
    UPDATE topics
    SET status = 'pending_result', correct_answer = NULL, confirmed_at = NULL, confirmed_by = NULL
    WHERE topic_id = p_topic_id;

    -- 3. 남아있는(무효 아닌) 정산 기록만으로 점수를 시간순 재생 —
    --    ⚠️ 영향받은 유저 목록을 별도 임시테이블로 만들지 않고 매번 서브쿼리로 직접 조회함.
    --    (TEMPORARY TABLE은 재귀 CTE 안에서 두 번 이상 열 수 없다는 MySQL 제약(에러 1137)이 있어서
    --     임시테이블 대신 일반 테이블인 score_settlements를 그때그때 서브쿼리로 참조하도록 우회함)
    DROP TEMPORARY TABLE IF EXISTS tmp_replayed;
    CREATE TEMPORARY TABLE tmp_replayed AS
    WITH RECURSIVE ranked AS (
        SELECT
            s.user_id, s.settlement_id, s.score_delta, s.settled_at,
            ROW_NUMBER() OVER (PARTITION BY s.user_id ORDER BY s.settled_at, s.settlement_id) AS rn
        FROM score_settlements s
        WHERE s.is_reversed = 0
          AND s.user_id IN (SELECT DISTINCT user_id FROM score_settlements WHERE topic_id = p_topic_id)
    ),
    replay AS (
        SELECT user_id, settlement_id, rn, GREATEST(0, score_delta) AS running_score
        FROM ranked WHERE rn = 1
        UNION ALL
        SELECT r.user_id, r.settlement_id, r.rn, GREATEST(0, p.running_score + r.score_delta)
        FROM ranked r
        JOIN replay p ON p.user_id = r.user_id AND p.rn = r.rn - 1
    )
    SELECT rp.user_id, rp.running_score
    FROM replay rp
    JOIN (SELECT user_id, MAX(rn) AS max_rn FROM ranked GROUP BY user_id) m
        ON m.user_id = rp.user_id AND m.max_rn = rp.rn;

    -- 4. 재생 결과 반영 (남은 정산 기록이 있는 유저)
    UPDATE users u
    JOIN tmp_replayed r ON r.user_id = u.user_id
    SET u.credibility_score = r.running_score;

    -- 5. 이 주제 하나만 정산 기록이 있었던 유저(재생할 게 하나도 안 남음)는 0으로
    UPDATE users u
    SET u.credibility_score = 0
    WHERE u.user_id IN (SELECT DISTINCT user_id FROM score_settlements WHERE topic_id = p_topic_id)
      AND NOT EXISTS (SELECT 1 FROM tmp_replayed r WHERE r.user_id = u.user_id);

    -- 6. 영향받은 유저 전원 티어 재계산 (reason='correction'으로 구분 기록)
    DROP TEMPORARY TABLE IF EXISTS tmp_tier_fix;
    CREATE TEMPORARY TABLE tmp_tier_fix AS
    SELECT
        u.user_id, u.tier AS old_tier,
        (CASE
            WHEN u.credibility_score >= 500 AND u.activity_suppressed = 0 THEN '마스터'
            WHEN u.credibility_score >= 500 AND u.activity_suppressed = 1 THEN '플래티넘'
            WHEN u.credibility_score >= 400 AND u.activity_suppressed = 0 THEN '다이아'
            WHEN u.credibility_score >= 400 AND u.activity_suppressed = 1 THEN '플래티넘'
            WHEN u.credibility_score >= 300 THEN '플래티넘'
            WHEN u.credibility_score >= 200 THEN '골드'
            WHEN u.credibility_score >= 100 THEN '실버'
            WHEN u.credibility_score >= 1   THEN '브론즈'
            ELSE '언랭크'
        END) COLLATE utf8mb4_unicode_ci AS new_tier
    FROM users u
    WHERE u.user_id IN (SELECT DISTINCT user_id FROM score_settlements WHERE topic_id = p_topic_id);

    INSERT INTO tier_changes (user_id, previous_tier, new_tier, reason)
    SELECT user_id, old_tier, new_tier, 'correction'
    FROM tmp_tier_fix WHERE old_tier != new_tier;

    UPDATE users u
    JOIN tmp_tier_fix t ON t.user_id = u.user_id
    SET u.tier = t.new_tier
    WHERE u.tier != t.new_tier;

    DROP TEMPORARY TABLE IF EXISTS tmp_replayed;
    DROP TEMPORARY TABLE IF EXISTS tmp_tier_fix;

    COMMIT;
END //

DELIMITER ;


-- =====================================================================
-- 14. 주제 수정 프로시저 2종
--     ① sp_update_topic: 참여자가 0명일 때만 전체 내용 수정 가능
--     ② sp_extend_topic_deadline: 참여자가 있어도 마감시각 "연장"만 가능
--        (내용을 잠그는 이유: 이미 투표한 사람이 본 질문이 사후에 바뀌면 공정성 문제 발생)
-- =====================================================================
DELIMITER //

CREATE PROCEDURE sp_update_topic(
    IN p_topic_id BIGINT UNSIGNED,
    IN p_category_id TINYINT UNSIGNED,
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_vote_start_at DATETIME,
    IN p_vote_deadline_at DATETIME
)
BEGIN
    DECLARE v_status VARCHAR(20);
    DECLARE v_vote_count INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SELECT status INTO v_status FROM topics WHERE topic_id = p_topic_id;
    SELECT COUNT(*) INTO v_vote_count FROM votes WHERE topic_id = p_topic_id;

    IF v_status != 'open' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = '진행중(open) 상태인 주제만 수정할 수 있습니다.';
    END IF;

    IF v_vote_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = '이미 참여자가 있는 주제는 내용을 수정할 수 없습니다. 마감시각 연장은 sp_extend_topic_deadline을 사용하세요.';
    END IF;

    START TRANSACTION;
    UPDATE topics
    SET category_id = p_category_id,
        title = p_title,
        description = p_description,
        vote_start_at = p_vote_start_at,
        vote_deadline_at = p_vote_deadline_at
    WHERE topic_id = p_topic_id;
    COMMIT;
END //

CREATE PROCEDURE sp_extend_topic_deadline(
    IN p_topic_id BIGINT UNSIGNED,
    IN p_new_deadline DATETIME
)
BEGIN
    DECLARE v_status VARCHAR(20);
    DECLARE v_current_deadline DATETIME;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SELECT status, vote_deadline_at INTO v_status, v_current_deadline
    FROM topics WHERE topic_id = p_topic_id;

    IF v_status != 'open' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = '진행중(open)인 주제만 마감시각을 조정할 수 있습니다.';
    END IF;

    IF p_new_deadline <= v_current_deadline THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = '새 마감시각은 기존 마감시각보다 늦어야 합니다 (연장만 가능, 단축 불가).';
    END IF;

    START TRANSACTION;
    UPDATE topics SET vote_deadline_at = p_new_deadline WHERE topic_id = p_topic_id;
    COMMIT;
END //

DELIMITER ;


-- =====================================================================
-- 15. 관리자 권한 부여/해제 프로시저
--     안전장치: ① 관리자만 이 작업을 실행 가능 ② 마지막 남은 관리자는 강등 불가
--     (실수로 관리자가 0명이 되면 아무도 관리자 페이지에 못 들어가는 상황 방지)
-- =====================================================================
DELIMITER //

CREATE PROCEDURE sp_set_admin_role(
    IN p_target_user_id BIGINT UNSIGNED,  -- 권한을 바꿀 대상
    IN p_new_role VARCHAR(10),            -- 'user' 또는 'admin'
    IN p_actor_user_id BIGINT UNSIGNED    -- 이 작업을 실행하는 사람 (권한 검증용)
)
BEGIN
    DECLARE v_actor_role VARCHAR(10);
    DECLARE v_admin_count INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_new_role NOT IN ('user','admin') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'role은 user 또는 admin만 가능합니다.';
    END IF;

    SELECT role INTO v_actor_role FROM users WHERE user_id = p_actor_user_id;

    IF v_actor_role IS NULL OR v_actor_role != 'admin' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '관리자 권한이 있는 계정만 권한을 변경할 수 있습니다.';
    END IF;

    -- 마지막 남은 관리자를 강등시키는 것 방지
    IF p_new_role = 'user' THEN
        SELECT COUNT(*) INTO v_admin_count FROM users WHERE role = 'admin';
        IF v_admin_count <= 1 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '마지막 남은 관리자는 권한을 해제할 수 없습니다.';
        END IF;
    END IF;

    START TRANSACTION;
    UPDATE users SET role = p_new_role WHERE user_id = p_target_user_id;
    COMMIT;
END //

DELIMITER ;


-- =====================================================================
-- 16. 관리자 페이지에서 자주 쓸 조회 쿼리 모음 (참고용, 실행 대상 아님)
-- =====================================================================

-- ① 결과 대기 중인 주제 목록
-- SELECT topic_id, category_id, title, vote_deadline_at,
--        (SELECT COUNT(*) FROM votes WHERE votes.topic_id = topics.topic_id) AS total_votes
-- FROM topics
-- WHERE status = 'pending_result'
-- ORDER BY vote_deadline_at ASC;

-- ② 특정 주제 상세 + 실시간 Yes/No 득표 현황
-- SELECT t.topic_id, t.title, t.status,
--        COUNT(CASE WHEN v.choice='yes' THEN 1 END) AS yes_live,
--        COUNT(CASE WHEN v.choice='no' THEN 1 END) AS no_live
-- FROM topics t
-- LEFT JOIN votes v ON v.topic_id = t.topic_id
-- WHERE t.topic_id = ?
-- GROUP BY t.topic_id;

-- ③ 마감시각 지난 open 주제를 pending_result로 자동 전환 (배치/크론에서 주기 실행)
-- UPDATE topics
-- SET status = 'pending_result'
-- WHERE status = 'open' AND vote_deadline_at <= NOW();

-- ④ 결과 확정 실행 (관리자 페이지 "확정" 버튼이 호출)
-- CALL sp_confirm_topic_result(123, 'yes', 5);

-- ⑤ 오확정 정정 실행 (관리자 페이지 "정정" 버튼이 호출) — confirmed/void 상태 주제만 가능
-- CALL sp_correct_topic_result(123);
-- 정정 후 올바른 정답으로 다시 확정하려면:
-- CALL sp_confirm_topic_result(123, '올바른정답', 5);

-- ⑥ 이미 확정된 주제인지, 정산이 몇 건이나 걸려있는지 미리 확인 (정정 버튼 노출 여부 판단용)
-- SELECT t.topic_id, t.title, t.status, t.confirmed_at, t.confirmed_by,
--        COUNT(s.settlement_id) AS active_settlement_count
-- FROM topics t
-- LEFT JOIN score_settlements s ON s.topic_id = t.topic_id AND s.is_reversed = 0
-- WHERE t.topic_id = ?
-- GROUP BY t.topic_id;

-- ⑦ 주제 목록 전체 조회 (카테고리/상태 필터 + 검색어, 페이지네이션)
-- SELECT t.topic_id, c.name AS category_name, t.title, t.status,
--        t.vote_start_at, t.vote_deadline_at,
--        (SELECT COUNT(*) FROM votes WHERE votes.topic_id = t.topic_id) AS total_votes
-- FROM topics t
-- JOIN categories c ON c.category_id = t.category_id
-- WHERE (? IS NULL OR t.category_id = ?)
--   AND (? IS NULL OR t.status = ?)
--   AND (? IS NULL OR t.title LIKE CONCAT('%', ?, '%'))
-- ORDER BY t.created_at DESC
-- LIMIT ? OFFSET ?;

-- ⑧ 주제 수정 가능 여부 확인
-- SELECT t.topic_id, t.status,
--        (SELECT COUNT(*) FROM votes WHERE votes.topic_id = t.topic_id) AS vote_count,
--        (t.status = 'open' AND (SELECT COUNT(*) FROM votes WHERE votes.topic_id = t.topic_id) = 0) AS can_full_edit,
--        (t.status = 'open') AS can_extend_deadline
-- FROM topics t
-- WHERE t.topic_id = ?;

-- ⑨ 주제 수정 실행 (참여자 0명일 때만 가능)
-- CALL sp_update_topic(123, 2, '수정된 제목', '수정된 설명', '2026-09-01 00:00:00', '2026-09-05 23:59:59');

-- ⑩ 마감시각만 연장 (참여자 있어도 가능, 연장만 허용)
-- CALL sp_extend_topic_deadline(123, '2026-09-10 23:59:59');

-- ⑪ 주제 무효 처리 (마감 전이든 후든 가능 — sp_confirm_topic_result의 void 분기 재사용)
-- CALL sp_confirm_topic_result(123, 'void', 5);

-- ⑫ 유저 검색 (닉네임 부분일치 + role/티어 필터, 페이지네이션)
-- SELECT user_id, nickname, tier, credibility_score, role, created_at
-- FROM users
-- WHERE (? IS NULL OR nickname LIKE CONCAT('%', ?, '%'))
--   AND (? IS NULL OR role = ?)
--   AND (? IS NULL OR tier = ?)
-- ORDER BY created_at DESC
-- LIMIT ? OFFSET ?;

-- ⑬ 유저 상세 정보 (통계 포함) — 문의 대응, 부정이용 확인용
-- SELECT
--     u.user_id, u.nickname, u.tier, u.credibility_score, u.role,
--     u.activity_suppressed, u.created_at,
--     (SELECT COUNT(*) FROM votes WHERE votes.user_id = u.user_id) AS total_votes,
--     (SELECT COUNT(*) FROM score_settlements
--      WHERE score_settlements.user_id = u.user_id AND result = 'correct' AND is_reversed = 0) AS correct_count,
--     (SELECT COUNT(*) FROM score_settlements
--      WHERE score_settlements.user_id = u.user_id AND result IN ('correct','incorrect') AND is_reversed = 0) AS graded_count
-- FROM users u
-- WHERE u.user_id = ?;
-- (정답률 = correct_count / graded_count 는 애플리케이션 단에서 계산)

-- ⑭ 현재 관리자 목록 조회
-- SELECT user_id, nickname, created_at FROM users WHERE role = 'admin';

-- ⑮ 관리자 권한 부여/해제 실행
-- CALL sp_set_admin_role(대상user_id, 'admin', 실행자admin_id);   -- 권한 부여
-- CALL sp_set_admin_role(대상user_id, 'user', 실행자admin_id);    -- 권한 해제


-- =====================================================================
-- 17. 댓글(커뮤니티) 기능 — 테이블 3종
--     각 투표 주제(topics)에 달리는 댓글 시스템.
--     핵심 규칙: 댓글 작성은 "그 주제에 먼저 투표한 유저"만 가능.
--     작성자의 현재 티어 / 그 주제에서 고른 Yes·No 태그는 댓글에 저장하지 않고
--     조회 시점에 users, votes와 조인해서 보여줌 (아래 19번 참고 쿼리).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 17-1. comments : 댓글 본문 (원댓글 + 1단계 대댓글)
--       대댓글은 1단계까지만 허용 — 대댓글에 다시 답글 불가 (sp_create_comment에서 강제).
--       삭제는 소프트 삭제 — 행을 지우지 않고 is_deleted 플래그만 세워
--       대댓글이 달린 원댓글이 삭제돼도 스레드 구조가 깨지지 않게 함.
-- ---------------------------------------------------------------------
CREATE TABLE comments (
    comment_id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,  -- 댓글 고유 번호(자동 증가)
    topic_id            BIGINT UNSIGNED NOT NULL,                    -- 이 댓글이 달린 주제 (topics 참조)
    user_id             BIGINT UNSIGNED NOT NULL,                    -- 작성자 (users 참조). 이 주제에 투표한 유저여야만 함
    parent_comment_id   BIGINT UNSIGNED NULL,                        -- 대댓글이면 원댓글의 comment_id, 원댓글이면 NULL
    content             TEXT NOT NULL,                               -- 댓글 본문
    like_count          INT UNSIGNED NOT NULL DEFAULT 0,             -- 좋아요 수 (comment_likes 집계 캐시. 좋아요순 정렬 최적화용, sp_toggle_comment_like만 갱신)
    is_deleted          TINYINT(1) NOT NULL DEFAULT 0,               -- 소프트 삭제 여부 (0=정상, 1=삭제됨). 삭제돼도 행과 스레드는 보존
    deleted_reason      ENUM('self','moderation') NULL,             -- 삭제 사유 (self=본인 삭제 / moderation=관리자 신고 조치). is_deleted=0이면 NULL
    deleted_at          DATETIME NULL,                               -- 삭제 시각 (미삭제면 NULL)
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 작성 시각
    updated_at          DATETIME NULL DEFAULT NULL
                             ON UPDATE CURRENT_TIMESTAMP,            -- 마지막 변경 시각 (좋아요 수 갱신·삭제 처리 포함)

    FOREIGN KEY (topic_id) REFERENCES topics(topic_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (parent_comment_id) REFERENCES comments(comment_id),  -- 자기참조 (원댓글 ← 대댓글)
    INDEX idx_comments_topic_created (topic_id, created_at),           -- 최신순 정렬 조회
    INDEX idx_comments_topic_likes (topic_id, like_count),            -- 좋아요순 정렬 조회
    INDEX idx_comments_parent (parent_comment_id),                    -- 특정 원댓글의 대댓글 조회 (FK 인덱스 겸용)
    INDEX idx_comments_user (user_id)                                 -- 유저별 조회 / 신용도순 정렬 시 users 조인
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------
-- 17-2. comment_likes : 댓글 좋아요 (토글 방식)
--       한 유저가 한 댓글에 좋아요 1개만 — UNIQUE로 중복 원천 차단.
--       토글 취소 시 행을 물리 삭제하고 comments.like_count를 -1 (sp_toggle_comment_like).
-- ---------------------------------------------------------------------
CREATE TABLE comment_likes (
    like_id     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,          -- 좋아요 고유 번호(자동 증가)
    comment_id  BIGINT UNSIGNED NOT NULL,                            -- 좋아요가 눌린 댓글 (comments 참조)
    user_id     BIGINT UNSIGNED NOT NULL,                            -- 좋아요를 누른 유저 (users 참조)
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,         -- 좋아요 누른 시각

    FOREIGN KEY (comment_id) REFERENCES comments(comment_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    UNIQUE KEY uq_comment_likes_comment_user (comment_id, user_id),  -- 유저당 댓글 1좋아요 (중복 좋아요 방지)
    INDEX idx_comment_likes_user (user_id)                           -- 유저가 좋아요한 댓글 목록 조회
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------
-- 17-3. comment_reports : 댓글 신고
--       같은 유저가 같은 댓글을 중복 신고 불가 — UNIQUE로 차단.
--       관리자가 검토 후 기각(dismissed) 또는 삭제 조치(actioned) — sp_moderate_comment.
-- ---------------------------------------------------------------------
CREATE TABLE comment_reports (
    report_id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,  -- 신고 고유 번호(자동 증가)
    comment_id          BIGINT UNSIGNED NOT NULL,                    -- 신고 대상 댓글 (comments 참조)
    reporter_user_id    BIGINT UNSIGNED NOT NULL,                    -- 신고한 유저 (users 참조)
    reason_code         ENUM('spam','abuse','sexual','advertisement','etc') NOT NULL,
                             -- 신고 사유 코드 (spam=도배 / abuse=욕설·비방 / sexual=음란 / advertisement=광고 / etc=기타)
    reason_detail       VARCHAR(255) NULL,                           -- 신고 사유 상세 (선택 입력)
    status              ENUM('pending','dismissed','actioned') NOT NULL DEFAULT 'pending',
                             -- pending=검토대기 / dismissed=기각 / actioned=조치완료(댓글 삭제됨)
    handled_by          BIGINT UNSIGNED NULL,                        -- 처리한 관리자 (users 참조). 미처리면 NULL
    handled_at          DATETIME NULL,                               -- 처리 시각. 미처리면 NULL
    moderator_note      VARCHAR(255) NULL,                           -- 관리자 처리 메모 (선택)
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 신고 접수 시각

    FOREIGN KEY (comment_id) REFERENCES comments(comment_id),
    FOREIGN KEY (reporter_user_id) REFERENCES users(user_id),
    FOREIGN KEY (handled_by) REFERENCES users(user_id),
    UNIQUE KEY uq_comment_reports_comment_reporter (comment_id, reporter_user_id),  -- 같은 유저가 같은 댓글 중복 신고 불가
    INDEX idx_comment_reports_status (status),                       -- 검토대기 목록 조회 (관리자 페이지)
    INDEX idx_comment_reports_comment (comment_id)                   -- 특정 댓글에 걸린 신고 조회
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 18. 댓글 기능 저장 프로시저 5종
--     ⚠️ 기존 프로시저에서 겪은 버그 예방 규칙을 그대로 적용:
--       · 상태 변경 프로시저는 시작부에서 현재 상태를 확인하고,
--         이미 처리된 상태면 SIGNAL SQLSTATE '45000'으로 한국어 에러를 던지고 중단.
--       · 예외 발생 시 EXIT HANDLER로 자동 ROLLBACK 후 RESIGNAL.
--       · 이 기능엔 재귀 CTE가 필요 없어 "재귀 CTE + 임시테이블" 제약(에러 1137)에
--         걸릴 일이 없음. 임시테이블 자체를 쓰지 않음.
--       · 계산된 문자열을 테이블 컬럼과 비교하는 로직이 없어(모두 리터럴·ENUM 대입)
--         "Illegal mix of collations"가 날 지점이 없음. 만약 CASE로 문자열을 만들어
--         컬럼과 비교하게 되면 그 표현식 끝에 COLLATE utf8mb4_unicode_ci를 붙일 것.
-- =====================================================================
DELIMITER //

-- ---------------------------------------------------------------------
-- 18-1. sp_create_comment : 댓글 / 대댓글 작성
--       · 그 주제에 투표한 유저만 작성 가능 (votes 존재 여부 필수 체크)
--       · 대댓글은 1단계까지만 — 대댓글(parent_comment_id 있는 댓글)에는 답글 불가
--       · 삭제된 댓글에는 답글 불가
--       · 부모 댓글은 같은 주제의 것이어야 함
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_create_comment(
    IN p_topic_id BIGINT UNSIGNED,
    IN p_user_id BIGINT UNSIGNED,
    IN p_parent_comment_id BIGINT UNSIGNED,   -- 원댓글이면 NULL, 대댓글이면 부모 comment_id
    IN p_content TEXT
)
BEGIN
    DECLARE v_voted INT;
    DECLARE v_parent_topic_id BIGINT UNSIGNED;
    DECLARE v_parent_is_reply BIGINT UNSIGNED;
    DECLARE v_parent_deleted TINYINT(1);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- 0. 본문 유효성
    IF p_content IS NULL OR TRIM(p_content) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '댓글 내용을 입력하세요.';
    END IF;

    -- 1. ⚠️ 작성 자격: 이 주제에 투표한 유저만 댓글 작성 가능
    SELECT COUNT(*) INTO v_voted
    FROM votes WHERE topic_id = p_topic_id AND user_id = p_user_id;

    IF v_voted = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = '이 주제에 투표한 유저만 댓글을 작성할 수 있습니다.';
    END IF;

    -- 2. 대댓글이면 부모 댓글 검증
    IF p_parent_comment_id IS NOT NULL THEN
        SELECT topic_id, parent_comment_id, is_deleted
        INTO v_parent_topic_id, v_parent_is_reply, v_parent_deleted
        FROM comments WHERE comment_id = p_parent_comment_id;

        IF v_parent_topic_id IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '답글을 달 원댓글이 존재하지 않습니다.';
        END IF;

        IF v_parent_topic_id != p_topic_id THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '원댓글과 다른 주제에는 답글을 달 수 없습니다.';
        END IF;

        -- 1단계 제한: 부모가 이미 대댓글이면 그 아래에 또 답글 불가
        IF v_parent_is_reply IS NOT NULL THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = '대댓글에는 다시 답글을 달 수 없습니다 (대댓글은 1단계까지만 허용).';
        END IF;

        IF v_parent_deleted = 1 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '삭제된 댓글에는 답글을 달 수 없습니다.';
        END IF;
    END IF;

    -- 3. 저장
    START TRANSACTION;
    INSERT INTO comments (topic_id, user_id, parent_comment_id, content)
    VALUES (p_topic_id, p_user_id, p_parent_comment_id, p_content);
    COMMIT;

    SELECT LAST_INSERT_ID() AS comment_id;   -- 방금 만든 댓글 id 반환
END //


-- ---------------------------------------------------------------------
-- 18-2. sp_toggle_comment_like : 좋아요 토글
--       · 좋아요가 이미 있으면 취소(행 삭제 + like_count -1)
--       · 없으면 추가(행 삽입 + like_count +1)
--       · 중복 좋아요는 UNIQUE 제약으로도 차단되지만 토글 로직상 애초에 발생하지 않음
--       · 삭제된 댓글에는 새로 좋아요 불가 (단, 기존 좋아요 취소는 항상 허용)
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_toggle_comment_like(
    IN p_comment_id BIGINT UNSIGNED,
    IN p_user_id BIGINT UNSIGNED
)
BEGIN
    DECLARE v_is_deleted TINYINT(1);
    DECLARE v_action VARCHAR(10);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- 1. 대상 댓글 행을 잠근 채로 상태 확인
    --    ⚠️ 존재/삭제 여부를 트랜잭션 밖에서 미리 읽어 분기하면, 그 사이 동시 토글로
    --       좋아요 행 상태가 바뀌어 like_count가 실제 좋아요 수와 어긋날 수 있음.
    --       FOR UPDATE로 댓글 행을 잠가 같은 댓글의 토글을 직렬화한다.
    SELECT is_deleted INTO v_is_deleted
    FROM comments WHERE comment_id = p_comment_id FOR UPDATE;

    IF v_is_deleted IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '존재하지 않는 댓글입니다.';
    END IF;

    -- 2. 토글 방향은 "미리 읽은 값"이 아니라 DELETE의 실제 적중 행수로 결정한다.
    DELETE FROM comment_likes WHERE comment_id = p_comment_id AND user_id = p_user_id;

    IF ROW_COUNT() > 0 THEN
        -- 좋아요가 있었음 → 취소 (삭제된 댓글이어도 취소는 허용)
        UPDATE comments
        SET like_count = IF(like_count > 0, like_count - 1, 0)   -- UNSIGNED 언더플로 방지
        WHERE comment_id = p_comment_id;
        SET v_action = 'unliked';
    ELSE
        -- 좋아요가 없었음 → 추가 (삭제된 댓글엔 불가)
        IF v_is_deleted = 1 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '삭제된 댓글에는 좋아요를 누를 수 없습니다.';
        END IF;
        INSERT INTO comment_likes (comment_id, user_id) VALUES (p_comment_id, p_user_id);
        UPDATE comments SET like_count = like_count + 1 WHERE comment_id = p_comment_id;
        SET v_action = 'liked';
    END IF;

    -- 3. 결과 반환 — COMMIT 전, 행을 잠근 상태에서 읽어 정확한 값을 돌려준다.
    SELECT p_comment_id AS comment_id, v_action AS action, like_count AS like_count
    FROM comments WHERE comment_id = p_comment_id;

    COMMIT;
END //


-- ---------------------------------------------------------------------
-- 18-3. sp_delete_comment : 본인 댓글 소프트 삭제
--       · 본인이 작성한 댓글만 삭제 가능
--       · 이미 삭제된 댓글을 또 삭제 시도하면 에러 (중복 처리 가드)
--       · 행을 지우지 않고 is_deleted=1만 세움 — 대댓글이 달려 있어도 스레드 유지
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_delete_comment(
    IN p_comment_id BIGINT UNSIGNED,
    IN p_user_id BIGINT UNSIGNED
)
BEGIN
    DECLARE v_owner_id BIGINT UNSIGNED;
    DECLARE v_is_deleted TINYINT(1);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SELECT user_id, is_deleted INTO v_owner_id, v_is_deleted
    FROM comments WHERE comment_id = p_comment_id;

    IF v_owner_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '존재하지 않는 댓글입니다.';
    END IF;

    IF v_is_deleted = 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '이미 삭제된 댓글입니다.';
    END IF;

    IF v_owner_id != p_user_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '본인이 작성한 댓글만 삭제할 수 있습니다.';
    END IF;

    START TRANSACTION;
    UPDATE comments
    SET is_deleted = 1, deleted_reason = 'self', deleted_at = NOW()
    WHERE comment_id = p_comment_id;
    COMMIT;
END //


-- ---------------------------------------------------------------------
-- 18-4. sp_report_comment : 신고 접수
--       · 같은 유저가 같은 댓글을 중복 신고 불가 (명시적 체크 + UNIQUE 제약)
--       · 본인 댓글은 신고 불가
--       · 이미 삭제된 댓글은 신고 불가
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_report_comment(
    IN p_comment_id BIGINT UNSIGNED,
    IN p_reporter_user_id BIGINT UNSIGNED,
    IN p_reason_code VARCHAR(20),     -- 'spam' / 'abuse' / 'sexual' / 'advertisement' / 'etc'
    IN p_reason_detail VARCHAR(255)
)
BEGIN
    DECLARE v_owner_id BIGINT UNSIGNED;
    DECLARE v_is_deleted TINYINT(1);
    DECLARE v_dup INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_reason_code NOT IN ('spam','abuse','sexual','advertisement','etc') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = '신고 사유 코드는 spam, abuse, sexual, advertisement, etc 중 하나여야 합니다.';
    END IF;

    SELECT user_id, is_deleted INTO v_owner_id, v_is_deleted
    FROM comments WHERE comment_id = p_comment_id;

    IF v_owner_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '존재하지 않는 댓글입니다.';
    END IF;

    IF v_is_deleted = 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '이미 삭제된 댓글은 신고할 수 없습니다.';
    END IF;

    IF v_owner_id = p_reporter_user_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '본인이 작성한 댓글은 신고할 수 없습니다.';
    END IF;

    SELECT COUNT(*) INTO v_dup
    FROM comment_reports
    WHERE comment_id = p_comment_id AND reporter_user_id = p_reporter_user_id;

    IF v_dup > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '이미 신고한 댓글입니다.';
    END IF;

    START TRANSACTION;
    INSERT INTO comment_reports (comment_id, reporter_user_id, reason_code, reason_detail)
    VALUES (p_comment_id, p_reporter_user_id, p_reason_code, p_reason_detail);
    COMMIT;

    SELECT LAST_INSERT_ID() AS report_id;
END //


-- ---------------------------------------------------------------------
-- 18-5. sp_moderate_comment : 관리자의 신고 처리 (기각 / 삭제 조치)
--       · 관리자(role='admin')만 실행 가능
--       · 이미 처리된(pending 아님) 신고를 또 처리하면 에러 (중복 처리 가드)
--       · p_action='dismiss' → 신고 기각 (댓글 유지)
--       · p_action='delete'  → 댓글 소프트 삭제(deleted_reason='moderation') +
--                              해당 댓글에 걸린 다른 pending 신고도 모두 actioned로 정리
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_moderate_comment(
    IN p_report_id BIGINT UNSIGNED,
    IN p_admin_id BIGINT UNSIGNED,
    IN p_action VARCHAR(10),          -- 'dismiss' 또는 'delete'
    IN p_note VARCHAR(255)
)
BEGIN
    DECLARE v_admin_role VARCHAR(10);
    DECLARE v_report_status VARCHAR(20);
    DECLARE v_comment_id BIGINT UNSIGNED;
    DECLARE v_comment_deleted TINYINT(1);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_action NOT IN ('dismiss','delete') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'action은 dismiss 또는 delete만 가능합니다.';
    END IF;

    -- 1. 실행자 관리자 권한 확인
    SELECT role INTO v_admin_role FROM users WHERE user_id = p_admin_id;
    IF v_admin_role IS NULL OR v_admin_role != 'admin' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '관리자 권한이 있는 계정만 신고를 처리할 수 있습니다.';
    END IF;

    -- 2. 신고 존재 + 상태 확인 (중복 처리 가드)
    SELECT status, comment_id INTO v_report_status, v_comment_id
    FROM comment_reports WHERE report_id = p_report_id;

    IF v_report_status IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '존재하지 않는 신고입니다.';
    END IF;

    IF v_report_status != 'pending' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '이미 처리된 신고입니다.';
    END IF;

    START TRANSACTION;

    IF p_action = 'dismiss' THEN
        -- 기각: 이 신고만 종료, 댓글은 그대로
        UPDATE comment_reports
        SET status = 'dismissed', handled_by = p_admin_id, handled_at = NOW(), moderator_note = p_note
        WHERE report_id = p_report_id;
    ELSE
        -- 삭제 조치: 댓글 소프트 삭제 (이미 삭제돼 있으면 사유는 건드리지 않음)
        SELECT is_deleted INTO v_comment_deleted FROM comments WHERE comment_id = v_comment_id;

        IF v_comment_deleted = 0 THEN
            UPDATE comments
            SET is_deleted = 1, deleted_reason = 'moderation', deleted_at = NOW()
            WHERE comment_id = v_comment_id;
        END IF;

        -- 이 신고를 조치완료로
        UPDATE comment_reports
        SET status = 'actioned', handled_by = p_admin_id, handled_at = NOW(), moderator_note = p_note
        WHERE report_id = p_report_id;

        -- 같은 댓글에 걸린 나머지 대기 신고도 함께 정리 (댓글이 이미 사라졌으므로)
        UPDATE comment_reports
        SET status = 'actioned', handled_by = p_admin_id, handled_at = NOW(),
            moderator_note = COALESCE(moderator_note, '동일 댓글의 다른 신고 처리로 일괄 종료')
        WHERE comment_id = v_comment_id AND status = 'pending';
    END IF;

    COMMIT;
END //

DELIMITER ;


-- =====================================================================
-- 19. 댓글 목록 조회 쿼리 3종 (참고용, 실행 대상 아님)
--     공통: users를 조인해 "작성자의 현재 티어 / 신용도 점수"를,
--           votes를 조인해 "그 주제에서 고른 Yes·No 태그"를 조회 시점에 붙임.
--           댓글 작성 자격이 곧 투표 필수라 votes는 INNER JOIN으로도 항상 매칭됨.
--     정렬: 원댓글 그룹 단위로 정렬한 뒤, 그룹 안에서 원댓글 → 대댓글(오래된 순).
--           그룹 대표값은 원댓글(root) 기준 — root를 self-join으로 가져옴.
--           (1단계 대댓글만 있으므로 재귀 CTE 불필요.)
--     삭제된 댓글도 행은 그대로 반환 — 앱에서 "삭제된 댓글입니다"로 렌더링해
--     대댓글이 붙은 스레드가 끊기지 않게 함. (content 노출 여부는 앱에서 판단)
-- =====================================================================

-- ── 공통 컬럼(세 쿼리 동일) ────────────────────────────────────────────
--   c.comment_id, c.topic_id, c.parent_comment_id,
--   CASE WHEN c.is_deleted = 1 THEN NULL ELSE c.content END AS content,
--   c.is_deleted, c.deleted_reason, c.like_count, c.created_at,
--   u.user_id           AS author_id,
--   u.nickname          AS author_nickname,
--   u.tier              AS author_tier,           -- 작성 시점이 아닌 '현재' 티어
--   u.credibility_score AS author_credibility,    -- 신용도순 정렬 기준
--   v.choice            AS author_vote_choice     -- 이 주제에서 고른 yes / no 태그 (항상 존재)

-- ① 최신순 — 원댓글을 새로 쓴 순서로, 각 스레드는 원댓글 → 대댓글 순
-- SELECT
--     c.comment_id, c.topic_id, c.parent_comment_id,
--     CASE WHEN c.is_deleted = 1 THEN NULL ELSE c.content END AS content,
--     c.is_deleted, c.deleted_reason, c.like_count, c.created_at,
--     u.nickname AS author_nickname, u.tier AS author_tier,
--     u.credibility_score AS author_credibility,
--     v.choice AS author_vote_choice
-- FROM comments c
-- JOIN users  u   ON u.user_id = c.user_id
-- JOIN votes  v   ON v.user_id = c.user_id AND v.topic_id = c.topic_id
-- JOIN comments root ON root.comment_id = COALESCE(c.parent_comment_id, c.comment_id)
-- WHERE c.topic_id = ?
-- ORDER BY root.created_at DESC,                 -- 원댓글 그룹: 최신순
--          (c.parent_comment_id IS NOT NULL),    -- 그룹 내: 원댓글(0) 먼저
--          c.created_at ASC                      -- 대댓글끼리: 오래된 순
-- LIMIT ? OFFSET ?;

-- ② 좋아요순 — 원댓글의 좋아요 수가 많은 스레드부터
-- SELECT
--     c.comment_id, c.topic_id, c.parent_comment_id,
--     CASE WHEN c.is_deleted = 1 THEN NULL ELSE c.content END AS content,
--     c.is_deleted, c.deleted_reason, c.like_count, c.created_at,
--     u.nickname AS author_nickname, u.tier AS author_tier,
--     u.credibility_score AS author_credibility,
--     v.choice AS author_vote_choice
-- FROM comments c
-- JOIN users  u   ON u.user_id = c.user_id
-- JOIN votes  v   ON v.user_id = c.user_id AND v.topic_id = c.topic_id
-- JOIN comments root ON root.comment_id = COALESCE(c.parent_comment_id, c.comment_id)
-- WHERE c.topic_id = ?
-- ORDER BY root.like_count DESC,                 -- 원댓글 그룹: 좋아요 많은 순
--          root.created_at DESC,                 -- 동점이면 최신 원댓글 먼저
--          (c.parent_comment_id IS NOT NULL),
--          c.created_at ASC
-- LIMIT ? OFFSET ?;

-- ③ 신용도순 — 원댓글 작성자의 '현재' credibility_score가 높은 스레드부터
-- SELECT
--     c.comment_id, c.topic_id, c.parent_comment_id,
--     CASE WHEN c.is_deleted = 1 THEN NULL ELSE c.content END AS content,
--     c.is_deleted, c.deleted_reason, c.like_count, c.created_at,
--     u.nickname AS author_nickname, u.tier AS author_tier,
--     u.credibility_score AS author_credibility,
--     v.choice AS author_vote_choice
-- FROM comments c
-- JOIN users  u   ON u.user_id = c.user_id
-- JOIN votes  v   ON v.user_id = c.user_id AND v.topic_id = c.topic_id
-- JOIN comments root      ON root.comment_id = COALESCE(c.parent_comment_id, c.comment_id)
-- JOIN users    root_user ON root_user.user_id = root.user_id
-- WHERE c.topic_id = ?
-- ORDER BY root_user.credibility_score DESC,     -- 원댓글 작성자 신용도 높은 순
--          root.created_at DESC,                 -- 동점이면 최신 원댓글 먼저
--          (c.parent_comment_id IS NOT NULL),
--          c.created_at ASC
-- LIMIT ? OFFSET ?;

-- ④ 관리자 페이지 — 검토 대기 신고 목록 (댓글 본문·작성자·신고자 함께)
-- SELECT r.report_id, r.reason_code, r.reason_detail, r.created_at AS reported_at,
--        c.comment_id, c.content, c.is_deleted,
--        au.nickname AS author_nickname,
--        ru.nickname AS reporter_nickname,
--        (SELECT COUNT(*) FROM comment_reports r2
--          WHERE r2.comment_id = c.comment_id AND r2.status = 'pending') AS pending_report_count
-- FROM comment_reports r
-- JOIN comments c  ON c.comment_id = r.comment_id
-- JOIN users    au ON au.user_id = c.user_id
-- JOIN users    ru ON ru.user_id = r.reporter_user_id
-- WHERE r.status = 'pending'
-- ORDER BY r.created_at ASC;

-- ⑤ 댓글 기능 프로시저 호출 예시
-- CALL sp_create_comment(123, 45, NULL, '이번엔 Yes 갑니다');      -- 원댓글
-- CALL sp_create_comment(123, 67, 890, '저도 동의해요');           -- 890번 원댓글에 대댓글
-- CALL sp_toggle_comment_like(890, 45);                            -- 좋아요 토글(누르면 like, 다시 누르면 unlike)
-- CALL sp_delete_comment(890, 67);                                 -- 본인(67번) 댓글 소프트 삭제
-- CALL sp_report_comment(890, 45, 'abuse', '욕설이 포함되어 있습니다');
-- CALL sp_moderate_comment(5, 1, 'dismiss', '신고 사유 불충분');   -- 5번 신고 기각 (관리자 1번)
-- CALL sp_moderate_comment(5, 1, 'delete', '욕설 확인, 삭제 조치'); -- 5번 신고 인용 + 댓글 삭제
