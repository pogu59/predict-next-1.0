import type { Issue } from "@/lib/api"
import { DAY, HOUR } from "@/lib/issues"

/** 투표 기간이 이 시간 이하인 이슈를 "라이브"로 본다(백엔드 구분 없이 프론트에서만 판별). */
export const LIVE_WINDOW_MS = 3 * HOUR

type Window = Pick<Issue, "voteStartAt" | "voteDeadlineAt">

export function isLiveIssue(issue: Window) {
  return (
    Date.parse(issue.voteDeadlineAt) - Date.parse(issue.voteStartAt) <=
    LIVE_WINDOW_MS
  )
}

/**
 * 서버 스케줄러가 60초 주기로 OPEN → PENDING_RESULT를 돌리므로, 마감 시각이 지나면
 * status와 상관없이 닫힌 것으로 본다(이슈 상세와 같은 규칙).
 */
export function isLiveOpen(
  issue: Pick<Issue, "status" | "voteDeadlineAt">,
  now: number,
) {
  return issue.status === "OPEN" && Date.parse(issue.voteDeadlineAt) > now
}

const byDeadline = (a: Issue, b: Issue) =>
  Date.parse(a.voteDeadlineAt) - Date.parse(b.voteDeadlineAt)

/** 열린 라이브(마감 빠른 순) / 판정 중 / 최근 24시간 안에 확정된 라이브(최근 순). */
export function liveBuckets(issues: Issue[], now: number) {
  const live = issues.filter(isLiveIssue)
  return {
    open: live.filter((i) => isLiveOpen(i, now)).sort(byDeadline),
    judging: live
      .filter((i) => !isLiveOpen(i, now) && i.status !== "CONFIRMED")
      .sort(byDeadline),
    finished: live
      .filter(
        (i) =>
          i.status === "CONFIRMED" &&
          now - Date.parse(i.confirmedAt ?? i.voteDeadlineAt) < DAY,
      )
      .sort(
        (a, b) =>
          Date.parse(b.confirmedAt ?? b.voteDeadlineAt) -
          Date.parse(a.confirmedAt ?? a.voteDeadlineAt),
      ),
  }
}

/** "mm:ss", 1시간 이상이면 "h:mm:ss". */
export function clockLabel(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const pad = (n: number) => String(n).padStart(2, "0")
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`
}
