import type { Issue, MyVote } from "@/lib/api"
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

/** 전체 투표 중 소수 의견 비율(%)이 이 값 이상이면 역발상형. */
export const CONTRARIAN_RATE = 40
/** 평균 스테이크가 이 값 이상이면 승부사형. */
export const BOLD_STAKE = 150
/** 이만큼 투표해야 유형을 판정한다. */
export const DNA_MIN_VOTES = 3

export type ArchetypeKey =
  | "contrarian-bold"
  | "contrarian-calm"
  | "majority-bold"
  | "majority-calm"
  | "rookie"

export const ARCHETYPES: Record<
  ArchetypeKey,
  { name: string; summary: string; tip: string }
> = {
  "contrarian-bold": {
    name: "역발상 승부사",
    summary:
      "남들이 덜 고른 쪽에 크게 거는 편이에요. 맞히는 날 한 번에 많이 올라요.",
    tip: "소수 쪽은 빗나가도 잃는 폭이 작아요. 대신 연속 실패가 길어질 수 있으니 '전부'는 아껴두세요.",
  },
  "contrarian-calm": {
    name: "조용한 저격수",
    summary:
      "소수 의견을 고르지만 무리해서 걸진 않아요. 적은 신용도로 큰 보상을 노리는 효율형이에요.",
    tip: "확신이 드는 소수 의견이 보이면 평소보다 조금 더 걸어도 손실 폭은 크지 않아요.",
  },
  "majority-bold": {
    name: "대세 승부사",
    summary:
      "흐름을 읽고 확신이 서면 크게 걸어요. 적중률은 높지만 다수가 틀리는 날이 위험해요.",
    tip: "다수 쪽은 맞혀도 보상이 작고, 빗나가면 크게 잃어요. 비율이 80%를 넘는 쪽엔 적게 걸어보세요.",
  },
  "majority-calm": {
    name: "신중한 분석가",
    summary:
      "다수의 판단을 참고하고 작게 나눠 걸어요. 크게 잃지 않는 안정형이에요.",
    tip: "가끔은 비율이 비슷한 접전 이슈에 참여해보세요. 접전일수록 보너스가 붙어요.",
  },
  rookie: {
    name: "탐색 중",
    summary:
      "아직 기록이 쌓이는 중이에요. 예측 3개가 모이면 성향을 알려드릴게요.",
    tip: "마감 임박 이슈부터 가볍게 참여해보세요. 결과가 빨리 나와요.",
  },
}

/** 내 선택지 비율 < 최대 비율이면 소수 의견(동률은 다수). */
export function isMinorityPick(vote: Pick<MyVote, "options" | "optionId">) {
  const pct = optionPercents(vote.options)
  const max = Math.max(...vote.options.map((o) => pct[o.id]))
  return pct[vote.optionId] < max
}

export function myPickPct(vote: Pick<MyVote, "options" | "optionId">) {
  return optionPercents(vote.options)[vote.optionId] ?? 0
}

const gradedAt = (v: MyVote) => Date.parse(v.confirmedAt ?? v.voteDeadlineAt)

export type PredictionDna = {
  archetype: ArchetypeKey
  total: number
  graded: number
  correct: number
  /** 0~100. 채점된 투표가 없으면 null. */
  accuracy: number | null
  /** 전체 투표 중 소수 의견을 고른 비율(%). */
  minorityRate: number
  minorityHits: number
  averageStake: number
  bestHit: { delta: number; title: string; issueId: number; pct: number } | null
  currentStreak: number
  bestStreak: number
  /** 최근 10개 채점 결과, 오래된 → 최근. */
  recentForm: ("W" | "L")[]
}

export function predictionDna(votes: MyVote[]): PredictionDna {
  const total = votes.length
  const graded = votes
    .filter((v) => v.result != null)
    .sort((a, b) => gradedAt(a) - gradedAt(b))
  const correctVotes = graded.filter((v) => v.result === "CORRECT")
  const minority = votes.filter(isMinorityPick)
  const minorityRate = total ? Math.round((minority.length / total) * 100) : 0
  const averageStake = total
    ? Math.round(votes.reduce((sum, v) => sum + v.stake, 0) / total)
    : 0

  let bestStreak = 0
  let run = 0
  for (const v of graded) {
    run = v.result === "CORRECT" ? run + 1 : 0
    bestStreak = Math.max(bestStreak, run)
  }

  const best = correctVotes.reduce<MyVote | null>(
    (top, v) => (!top || (v.scoreDelta ?? 0) > (top.scoreDelta ?? 0) ? v : top),
    null,
  )

  const archetype: ArchetypeKey =
    total < DNA_MIN_VOTES
      ? "rookie"
      : `${minorityRate >= CONTRARIAN_RATE ? "contrarian" : "majority"}-${averageStake >= BOLD_STAKE ? "bold" : "calm"}`

  return {
    archetype,
    total,
    graded: graded.length,
    correct: correctVotes.length,
    accuracy: graded.length
      ? Math.round((correctVotes.length / graded.length) * 100)
      : null,
    minorityRate,
    minorityHits: minority.filter((v) => v.result === "CORRECT").length,
    averageStake,
    bestHit: best
      ? {
          delta: best.scoreDelta ?? 0,
          title: best.title,
          issueId: best.issueId,
          pct: myPickPct(best),
        }
      : null,
    currentStreak: run,
    bestStreak,
    recentForm: graded
      .slice(-10)
      .map((v) => (v.result === "CORRECT" ? "W" : "L")),
  }
}
