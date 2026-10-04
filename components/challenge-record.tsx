"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import type { MyVote } from "@/lib/api"
import {
  challengeOutcome,
  readChallenges,
  type ChallengeOutcome,
  type SavedChallenge,
} from "@/lib/challenge"
import { useIssues } from "@/lib/queries/issue"
import { cn } from "@/lib/utils"

const OUTCOME_CHIP: Record<
  ChallengeOutcome,
  { label: string; className: string }
> = {
  win: { label: "승", className: "bg-brand text-white" },
  lose: { label: "패", className: "bg-line-3 text-sub" },
  both: { label: "둘 다 적중", className: "bg-brand-soft text-brand" },
  neither: { label: "둘 다 빗나감", className: "bg-line-3 text-sub" },
  "same-side": { label: "같은 편", className: "bg-line-3 text-sub" },
  spectator: { label: "관전", className: "bg-line-3 text-muted" },
  pending: { label: "진행 중", className: "bg-brand-soft text-brand" },
  open: { label: "관전", className: "bg-line-3 text-muted" },
}

/**
 * 마이페이지 "도전장 기록" — 이 브라우저에 저장된 받은 도전장을 내 투표 기록과 issueId로 맞춘다.
 * 투표 기록에 없는 도전장(내가 안 건 것)은 관전. 저장된 게 없으면 카드를 숨긴다.
 */
export function ChallengeRecord({
  votes,
  userId,
  className,
}: {
  votes: MyVote[]
  userId: number
  className?: string
}) {
  const [saved, setSaved] = useState<SavedChallenge[]>([])
  const { data: issues = [] } = useIssues(userId)

  // 브라우저 저장소 값이라 서버 렌더와 어긋나지 않게 마운트 후에 읽는다.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(readChallenges())
  }, [])

  if (saved.length === 0) return null

  const rows = saved.map((c) => {
    const vote = votes.find((v) => v.issueId === c.issueId)
    const issue = issues.find((i) => i.id === c.issueId)
    const outcome: ChallengeOutcome = vote
      ? challengeOutcome(vote, c.pick, vote.optionId)
      : "spectator"
    return {
      ...c,
      title: vote?.title ?? issue?.title ?? `이슈 #${c.issueId}`,
      outcome,
    }
  })
  const wins = rows.filter((r) => r.outcome === "win").length
  const losses = rows.filter((r) => r.outcome === "lose").length

  return (
    <div className={cn("flex flex-col bg-surface", className)}>
      <div className="flex items-baseline justify-between pb-1.5">
        <span className="text-base font-extrabold">도전장 기록</span>
        <span className="text-[13px] font-bold text-sub tabular-nums">
          친구 도전 {wins}승 {losses}패
        </span>
      </div>
      {rows.slice(0, 5).map((r) => (
        <Link
          key={`${r.issueId}-${r.vs}`}
          href={`/issue/${r.issueId}?vs=${encodeURIComponent(r.vs)}&pick=${r.pick}`}
          className="flex items-center gap-3 border-t border-line-3 py-3"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-sm font-semibold">{r.title}</span>
            <span className="truncate text-xs text-muted">vs {r.vs}</span>
          </div>
          <span
            className={cn(
              "rounded-[7px] px-2 py-[5px] text-xs font-bold whitespace-nowrap",
              OUTCOME_CHIP[r.outcome].className,
            )}
          >
            {OUTCOME_CHIP[r.outcome].label}
          </span>
        </Link>
      ))}
    </div>
  )
}
