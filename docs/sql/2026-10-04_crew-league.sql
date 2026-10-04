-- 2026-10-04 · 크루 대항전 (MySQL 8.x)
-- 운영 서버는 spring.jpa ddl-auto=update 라 백엔드(700e49c) 배포 시 아래 테이블이 자동으로 생긴다.
-- 이 파일은 수동 적용·검토용 기준 DDL이다. 기존 테이블은 건드리지 않는다(새 테이블만 추가).

CREATE TABLE IF NOT EXISTS crews (
  crew_id      BIGINT       NOT NULL AUTO_INCREMENT,
  name         VARCHAR(30)  NOT NULL,
  slug         VARCHAR(40)  NOT NULL,
  description  VARCHAR(200) NULL,
  active       TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   DATETIME(6)  NOT NULL,
  PRIMARY KEY (crew_id),
  UNIQUE KEY uq_crews_name (name),
  UNIQUE KEY uq_crews_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 유저당 크루 1개. previous_* 는 직전 소속(주 중간 이적 시 joined_at 이전 정산을 직전 크루로 보내는 데 쓴다).
CREATE TABLE IF NOT EXISTS user_crews (
  user_id             BIGINT      NOT NULL,
  crew_id             BIGINT      NOT NULL,
  joined_at           DATETIME(6) NOT NULL,
  previous_crew_id    BIGINT      NULL,
  previous_joined_at  DATETIME(6) NULL,
  PRIMARY KEY (user_id),
  KEY idx_user_crews_crew (crew_id),
  CONSTRAINT fk_user_crews_user          FOREIGN KEY (user_id)          REFERENCES users (user_id),
  CONSTRAINT fk_user_crews_crew          FOREIGN KEY (crew_id)          REFERENCES crews (crew_id),
  CONSTRAINT fk_user_crews_previous_crew FOREIGN KEY (previous_crew_id) REFERENCES crews (crew_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 주간 스냅샷. 월요일 00:00(KST) 배치가 방금 끝난 주를 고정한다. `rank` NULL = 집계 중(활성 5명 미만).
CREATE TABLE IF NOT EXISTS crew_weekly_scores (
  crew_weekly_score_id  BIGINT       NOT NULL AUTO_INCREMENT,
  crew_id               BIGINT       NOT NULL,
  week_start            DATE         NOT NULL,
  active_members        INT          NOT NULL,
  score_sum             INT          NOT NULL,
  score_per_member      DECIMAL(8,2) NOT NULL,
  `rank`                INT          NULL,
  created_at            DATETIME(6)  NOT NULL,
  PRIMARY KEY (crew_weekly_score_id),
  UNIQUE KEY uq_crew_week (crew_id, week_start),
  CONSTRAINT fk_crew_weekly_scores_crew FOREIGN KEY (crew_id) REFERENCES crews (crew_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 참고: 이번 주 크루별 유효 정산(활성 판정 전 원자료)
-- SELECT uc.crew_id, s.user_id, COUNT(*) AS settlements, SUM(s.score_delta) AS gain
--   FROM score_settlements s JOIN user_crews uc ON uc.user_id = s.user_id
--  WHERE s.is_reversed = 0 AND s.settled_at >= '2026-10-12' AND s.settled_at < '2026-10-19'
--  GROUP BY uc.crew_id, s.user_id;
