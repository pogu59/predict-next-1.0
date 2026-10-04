import type { Issue } from "@/lib/api"
import { optionPercents } from "@/lib/issues"

/** 1·2위 차이가 이 값(%p) 이하면 "한 끗 차이" 접전으로 본다. */
export const CLOSE_MARGIN = 20

export type CrowdRow = {
  issue: Issue
  correctPct: number
  correctText: string
  leaderText: string
  leaderPct: number
  /** 1위 - 2위 비율(%p). 선택지가 1개면 100. */
  margin: number
  /** 비율 1위가 정답이었나(정답 비율이 1위와 같으면 다수 적중으로 본다). */
  crowdRight: boolean
}

/** 확정된 이슈 한 건의 "다수의 감" 결과. 확정 전이거나 정답이 없으면 null. */
export function crowdRow(issue: Issue): CrowdRow | null {
  if (issue.status !== "CONFIRMED" || issue.correctOptionId == null) return null
  const correct = issue.options.find((o) => o.id === issue.correctOptionId)
  if (!correct) return null
  const pct = optionPercents(issue.options)
  // 안정 정렬이라 동률이면 먼저 나온 선택지가 1위가 된다.
  const sorted = [...issue.options].sort((a, b) => pct[b.id] - pct[a.id])
  const leader = sorted[0]
  const correctPct = pct[correct.id]
  const leaderPct = pct[leader.id]
  return {
    issue,
    correctPct,
    correctText: correct.text,
    leaderText: leader.text,
    leaderPct,
    margin: sorted.length > 1 ? leaderPct - pct[sorted[1].id] : 100,
    crowdRight: correctPct >= leaderPct,
  }
}

const settledAt = (issue: Issue) =>
  Date.parse(issue.confirmedAt ?? issue.voteDeadlineAt)

export type CrowdReport = {
  /** 확정 이슈, 최근 확정 순. */
  rows: CrowdRow[]
  crowdRightCount: number
  /** 다수 적중률 0~100. 확정 0건이면 null. */
  accuracy: number | null
  /** 다수가 빗나간 이슈, 정답 비율 낮은 순(가장 의외였던 것부터). */
  upsets: CrowdRow[]
  /** 1·2위가 CLOSE_MARGIN 이내였던 접전, 차이 작은 순 최대 3개. */
  closest: CrowdRow[]
  /** 결과 대기 이슈, 마감 빠른 순. */
  pending: Issue[]
}

export function crowdReport(issues: Issue[]): CrowdReport {
  const rows = issues
    .map(crowdRow)
    .filter((r): r is CrowdRow => r !== null)
    .sort((a, b) => settledAt(b.issue) - settledAt(a.issue))
  const crowdRightCount = rows.filter((r) => r.crowdRight).length
  return {
    rows,
    crowdRightCount,
    accuracy: rows.length
      ? Math.round((crowdRightCount / rows.length) * 100)
      : null,
    upsets: rows
      .filter((r) => !r.crowdRight)
      .sort((a, b) => a.correctPct - b.correctPct),
    closest: rows
      .filter((r) => r.issue.options.length >= 2 && r.margin <= CLOSE_MARGIN)
      .sort((a, b) => a.margin - b.margin)
      .slice(0, 3),
    pending: issues
      .filter((i) => i.status === "PENDING_RESULT")
      .sort(
        (a, b) => Date.parse(a.voteDeadlineAt) - Date.parse(b.voteDeadlineAt),
      ),
  }
}
