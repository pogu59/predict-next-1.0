import { formatRemaining, toLocalChoice } from "@/lib/issues"
import { categoryMeta } from "@/lib/category-meta"
import type { MyVoteDto } from "@/lib/api"
import { Icon } from "@/components/icon"

const CHOICE_LABEL = { yes: "그렇다", no: "아니다" } as const

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

type VoteHistoryRowProps = {
  vote: MyVoteDto
}

/** 마이페이지 "최근 투표 기록" 목록의 한 줄. */
export function VoteHistoryRow({ vote }: VoteHistoryRowProps) {
  const meta = categoryMeta(vote.categoryName)
  const myChoice = toLocalChoice(vote.choice)

  const total = (vote.yesCount ?? 0) + (vote.noCount ?? 0)
  const myCount = myChoice === "yes" ? (vote.yesCount ?? 0) : (vote.noCount ?? 0)
  const minorityPct = total > 0 ? Math.round((myCount / total) * 100) : undefined

  let sub: string
  let right: React.ReactNode

  if (vote.status === "OPEN") {
    sub = `${formatRemaining(vote.voteDeadlineAt)} 남음`
    right = <span className="text-ink-subtle text-[12.5px] font-bold">진행 중</span>
  } else if (vote.status === "PENDING_RESULT") {
    sub = minorityPct !== undefined ? `결과 대기 · 소수 ${minorityPct}%` : "결과 대기"
    right = <span className="text-ink-subtle text-[12.5px] font-bold">진행 중</span>
  } else if (vote.result === "VOID") {
    sub = `${formatDateTime(vote.confirmedAt!)} 무효 처리`
    right = <span className="text-ink-faint text-[12.5px] font-bold">무효</span>
  } else if (vote.result === "CORRECT") {
    sub = `${formatDateTime(vote.confirmedAt!)} 확정${minorityPct !== undefined ? ` · 소수 ${minorityPct}%` : ""}`
    right = (
      <span className="text-accent w-[78px] flex-none text-right text-[12.5px] font-extrabold tabular-nums">
        적중 +{vote.scoreDelta}
      </span>
    )
  } else {
    sub = `${formatDateTime(vote.confirmedAt!)} 확정${minorityPct !== undefined ? ` · 소수 ${minorityPct}%` : ""}`
    right = (
      <span className="text-ink-subtle w-[78px] flex-none text-right text-[12.5px] font-bold tabular-nums">
        실패 {vote.scoreDelta}
      </span>
    )
  }

  return (
    <div className="border-line flex items-center gap-3.5 border-t py-[13px] first:border-t-0">
      <Icon name={meta.icon} size={18} style={{ color: meta.color }} className="w-[26px] flex-none" />
      <div className="flex flex-1 flex-col gap-1">
        <span className="text-sm font-bold tracking-[-0.02em]">{vote.title}</span>
        <span className="text-ink-faint text-[11.5px] font-semibold tabular-nums">{sub}</span>
      </div>
      <span className="bg-control text-ink-muted flex-none rounded-lg px-2.5 py-1.5 text-xs font-bold">
        {CHOICE_LABEL[myChoice]}
      </span>
      {right}
    </div>
  )
}
