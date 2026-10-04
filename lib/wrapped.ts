import type { Issue, MyVote } from "@/lib/api"
import {
  crowdReport,
  myPickPct,
  predictionDna,
  type PredictionDna,
} from "@/lib/insights"

/** 결산 배너 노출 기간(한국시간). 페이지 자체는 기간과 상관없이 열린다(검수용). */
const SEASON_START = Date.parse("2026-12-15T00:00:00+09:00")
const SEASON_END = Date.parse("2027-01-31T23:59:59+09:00")

export const WRAPPED_YEAR = 2026
/** 이보다 적게 투표했으면 첫·마지막 장만 보여준다. */
export const WRAPPED_MIN_VOTES = 3

export function isWrappedSeason(now: Date | number) {
  const t = Number(now)
  return t >= SEASON_START && t <= SEASON_END
}

type VoteMoment = { issueId: number; title: string; delta: number; pct: number }

export type Wrapped = {
  year: number
  total: number
  firstVote: { issueId: number; title: string; votedAt: string } | null
  bestHit: VoteMoment | null
  worstMiss: VoteMoment | null
  bestStreak: number
  minorityHits: number
  myAccuracy: number | null
  /** 그 해 확정된 이슈들에서 비율 1위가 정답이었던 비율. */
  crowdAccuracy: number | null
  dna: PredictionDna
  busiestMonth: { month: number; count: number } | null
}

const moment = (v: MyVote): VoteMoment => ({
  issueId: v.issueId,
  title: v.title,
  delta: v.scoreDelta ?? 0,
  pct: myPickPct(v),
})

export function buildWrapped(
  votes: MyVote[],
  issues: Issue[],
  year = WRAPPED_YEAR,
): Wrapped {
  const inYear = (iso: string | null) =>
    iso != null && new Date(iso).getFullYear() === year
  const mine = votes
    .filter((v) => inYear(v.votedAt))
    .sort((a, b) => Date.parse(a.votedAt) - Date.parse(b.votedAt))
  const dna = predictionDna(mine)

  const correct = mine.filter((v) => v.result === "CORRECT")
  const wrong = mine.filter((v) => v.result === "INCORRECT")
  const best = correct.reduce<MyVote | null>(
    (top, v) => (!top || (v.scoreDelta ?? 0) > (top.scoreDelta ?? 0) ? v : top),
    null,
  )
  const worst = wrong.reduce<MyVote | null>(
    (low, v) => (!low || (v.scoreDelta ?? 0) < (low.scoreDelta ?? 0) ? v : low),
    null,
  )

  const byMonth = new Map<number, number>()
  for (const v of mine) {
    const m = new Date(v.votedAt).getMonth() + 1
    byMonth.set(m, (byMonth.get(m) ?? 0) + 1)
  }
  const busiest = [...byMonth.entries()].sort(
    (a, b) => b[1] - a[1] || a[0] - b[0],
  )[0]

  return {
    year,
    total: mine.length,
    firstVote: mine[0]
      ? {
          issueId: mine[0].issueId,
          title: mine[0].title,
          votedAt: mine[0].votedAt,
        }
      : null,
    bestHit: best ? moment(best) : null,
    worstMiss: worst ? moment(worst) : null,
    bestStreak: dna.bestStreak,
    minorityHits: dna.minorityHits,
    myAccuracy: dna.accuracy,
    crowdAccuracy: crowdReport(issues.filter((i) => inYear(i.confirmedAt)))
      .accuracy,
    dna,
    busiestMonth: busiest ? { month: busiest[0], count: busiest[1] } : null,
  }
}
