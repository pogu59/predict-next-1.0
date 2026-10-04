"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { CircleCheck } from "lucide-react"

import type { Issue } from "@/lib/api"
import { MINUTE, optionPercents } from "@/lib/issues"
import { clockLabel } from "@/lib/live"
import { useMe } from "@/lib/queries/auth"
import { useCastVote, useChangeVote } from "@/lib/queries/issue"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"

const LIVE_STAKES = [20, 50, 100]

/**
 * 열린 라이브 이슈 카드. 라이브는 속도가 핵심이라 선택지를 누르면 확인 단계 없이 바로 건다.
 * 이미 걸었으면 다른 선택지를 눌러 선택을 바꾼다(스테이크는 그대로).
 */
export function LiveCard({ issue, now }: { issue: Issue; now: number }) {
  const router = useRouter()
  const showToast = useToast()
  const { data: me } = useMe()
  const castVote = useCastVote(issue.id)
  const changeVote = useChangeVote(issue.id)
  const [stake, setStake] = useState(LIVE_STAKES[0])

  const credit = me?.credibilityScore ?? 0
  const remain = Date.parse(issue.voteDeadlineAt) - now
  const pct = optionPercents(issue.options)
  const busy = castVote.isPending || changeVote.isPending
  const voted = issue.myOptionId != null

  function pick(optionId: number) {
    if (!me) {
      router.push("/login")
      return
    }
    if (busy || remain <= 0 || optionId === issue.myOptionId) return
    const text = issue.options.find((o) => o.id === optionId)?.text ?? ""
    if (voted) {
      changeVote.mutate(optionId, {
        onSuccess: () => showToast(`${text}(으)로 변경했어요`),
        onError: (e) => showToast(e.message),
      })
      return
    }
    if (stake > credit) {
      showToast("보유 신용도가 부족해요")
      return
    }
    castVote.mutate(
      { userId: me.userId, optionId, stake },
      {
        onSuccess: () => showToast(`${text}에 ${stake} 걸었어요`),
        onError: (e) => showToast(e.message),
      },
    )
  }

  return (
    <article className="flex flex-col gap-3.5 rounded-3xl bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-extrabold tracking-[0.04em] text-danger-ink">
          <span className="size-2 animate-pulse rounded-full bg-danger" />
          LIVE
        </span>
        <span
          className={cn(
            "text-[26px] leading-none font-extrabold tracking-[-0.03em] tabular-nums",
            remain < MINUTE && "text-danger-ink",
          )}
        >
          {clockLabel(remain)}
        </span>
      </div>
      <h3 className="text-lg leading-[1.4] font-bold tracking-[-0.02em] text-pretty">
        {issue.title}
      </h3>
      <div className="flex flex-col gap-2">
        {issue.options.map((o) => {
          const mine = o.id === issue.myOptionId
          return (
            <button
              key={o.id}
              type="button"
              disabled={busy}
              onClick={() => pick(o.id)}
              className={cn(
                "relative flex min-h-[52px] items-center gap-2.5 overflow-hidden rounded-[15px] bg-surface px-3.5 text-left disabled:opacity-70",
                mine ? "shadow-selected" : "shadow-[inset_0_0_0_1.5px_#E7E7E4]",
              )}
            >
              <div
                className={cn(
                  "absolute inset-y-0 left-0 transition-[width] duration-500 ease-out-expo",
                  mine ? "bg-brand-fill" : "bg-[#F1F1EF]",
                )}
                style={{ width: `${pct[o.id] ?? 0}%` }}
              />
              {mine && <CircleCheck className="relative size-5 text-brand" />}
              <span
                className={cn(
                  "relative flex-1 text-[15px]",
                  mine ? "font-bold" : "font-semibold",
                )}
              >
                {o.text}
              </span>
              {mine && (
                <span className="relative rounded-md bg-brand px-[7px] py-[3px] text-[11px] font-bold text-white">
                  내 예측 · {issue.myStake}
                </span>
              )}
              <span className="relative min-w-10 text-right text-[15px] font-bold tabular-nums">
                {pct[o.id] ?? 0}%
              </span>
            </button>
          )
        })}
      </div>
      {voted ? (
        <span className="text-xs text-muted">
          마감 전까지 다른 선택지를 누르면 바로 바뀌어요
        </span>
      ) : (
        <div className="flex items-center gap-1.5">
          <span className="pr-1 text-xs font-semibold text-muted">
            걸 신용도
          </span>
          {LIVE_STAKES.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={stake === value}
              disabled={!!me && value > credit}
              onClick={() => setStake(value)}
              className={cn(
                "h-9 flex-1 rounded-[11px] text-sm font-bold tabular-nums disabled:text-disabled-ink",
                stake === value ? "bg-ink text-white" : "bg-track",
              )}
            >
              {value}
            </button>
          ))}
        </div>
      )}
    </article>
  )
}
