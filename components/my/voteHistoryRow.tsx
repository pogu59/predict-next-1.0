import { formatRemaining, useNow } from "@/lib/issues"
import { categoryMeta } from "@/lib/categoryMeta"
import type { MyVote } from "@/lib/api"
import { Icon } from "@/components/icon"

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

type VoteHistoryRowProps = {
  vote: MyVote
}

/** 마이페이지 "최근 투표 기록" 목록의 한 줄. */
export function VoteHistoryRow({ vote }: VoteHistoryRowProps) {
  const now = useNow()
  const meta = categoryMeta(vote.categoryName)

  const total = vote.options.reduce((sum, option) => sum + (option.voteCount ?? 0), 0)
  const myOption = vote.options.find((option) => option.id === vote.optionId)
  const minorityPct =
    total > 0 && myOption ? Math.round(((myOption.voteCount ?? 0) / total) * 100) : undefined

  let sub: string
  let right: React.ReactNode

  if (vote.status === "OPEN") {
    sub = formatRemaining(vote.voteDeadlineAt, now)
    right = <span className="text-ink-subtle text-caption">진행 중</span>
  } else if (vote.status === "PENDING_RESULT") {
    sub = minorityPct !== undefined ? `결과 대기 · 소수 ${minorityPct}%` : "결과 대기"
    right = <span className="text-ink-subtle text-caption">진행 중</span>
  } else if (vote.result === "CORRECT") {
    sub = `${formatDateTime(vote.confirmedAt!)} 확정${minorityPct !== undefined ? ` · 소수 ${minorityPct}%` : ""}`
    right = (
      <span className="text-accent w-[78px] flex-none text-right text-caption font-extrabold tabular-nums">
        적중 +{vote.scoreDelta}
      </span>
    )
  } else {
    sub = `${formatDateTime(vote.confirmedAt!)} 확정${minorityPct !== undefined ? ` · 소수 ${minorityPct}%` : ""}`
    right = (
      <span className="text-ink-subtle w-[78px] flex-none text-right text-caption tabular-nums">
        실패 {vote.scoreDelta}
      </span>
    )
  }

  return (
    <div className="border-line flex items-center gap-3.5 border-t py-[13px] first:border-t-0">
      <Icon name={meta.icon} size={18} style={{ color: meta.color }} className="w-[26px] flex-none" />
      <div className="flex flex-1 flex-col gap-1">
        <span className="text-label">{vote.title}</span>
        <span className="text-ink-faint text-caption font-semibold tabular-nums">{sub}</span>
      </div>
      <span className="bg-control text-ink-muted flex-none rounded-lg px-2.5 py-1.5 text-label">
        {vote.optionText}
      </span>
      {right}
    </div>
  )
}
