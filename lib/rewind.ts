import type { Issue } from "@/lib/api"
import { crowdRow } from "@/lib/insights"
import { optionPercents, payout } from "@/lib/issues"

/** 리와인드 실전 환산에 쓰는 가상 스테이크. */
export const REWIND_STAKE = 100
export const REWIND_ROUND_SIZE = 5
export const REWIND_MIN_POOL = 3

/** 다시 풀 수 있는 이슈 — 확정 + 정답 있음 + 선택지 2개 이상. 내가 안 푼 이슈를 앞에 둔다. */
export function rewindPool(issues: Issue[]) {
  const playable = issues.filter(
    (i) =>
      i.status === "CONFIRMED" &&
      i.correctOptionId != null &&
      i.options.length >= 2,
  )
  return [
    ...playable.filter((i) => i.myOptionId == null),
    ...playable.filter((i) => i.myOptionId != null),
  ]
}

function shuffle<T>(items: T[], random: () => number) {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 안 푼 이슈부터 섞어서 size개. 안 푼 이슈가 모자라면 푼 이슈를 섞어서 채운다. */
export function pickRound(
  pool: Issue[],
  size = REWIND_ROUND_SIZE,
  random: () => number = Math.random,
) {
  const fresh = pool.filter((i) => i.myOptionId == null)
  const seen = pool.filter((i) => i.myOptionId != null)
  return [...shuffle(fresh, random), ...shuffle(seen, random)].slice(0, size)
}

export type RewindGrade = {
  correct: boolean
  /** 내가 고른 쪽의 최종 비율. */
  pct: number
  /** 비율 1위가 정답이었나. */
  crowdRight: boolean
  /** 실전(100 걸기)이었다면: 적중 +win, 빗나감 -lose. */
  virtual: number
}

export function gradeAnswer(issue: Issue, optionId: number): RewindGrade {
  const pct = optionPercents(issue.options)[optionId] ?? 0
  const correct = optionId === issue.correctOptionId
  const { win, lose } = payout(pct, issue.options.length, REWIND_STAKE)
  return {
    correct,
    pct,
    crowdRight: crowdRow(issue)?.crowdRight ?? false,
    virtual: correct ? win : -lose,
  }
}
