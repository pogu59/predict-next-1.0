"use client"

import {
  Calendar,
  ChevronLeft,
  Circle,
  CircleCheck,
  CircleDot,
  EyeOff,
  Flag,
  Frown,
  Hourglass,
  PartyPopper,
  Share,
  type LucideIcon,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

import type { Issue } from "@/lib/api"
import { formatDateTime, issueChip, optionPercents, payout, useNow } from "@/lib/issues"
import { useMe } from "@/lib/queries/auth"
import { useCastVote, useChangeVote, useIssue, useIssueReplies } from "@/lib/queries/issue"
import { useMyVotes } from "@/lib/queries/user"
import { TierIcon } from "@/lib/tier"
import { cn } from "@/lib/utils"
import { IssueComments } from "@/components/issue-comments"
import { Chip } from "@/components/ui/brand"
import { ImageBox } from "@/components/ui/image-box"
import { useToast } from "@/components/ui/toast"

type ResultCard = { Icon: LucideIcon; ink: string; bg: string; title: string; sub: string }

function resultCard(issue: Issue, scoreDelta: number | null | undefined): ResultCard {
  const text = (id: number | null) => issue.options.find((o) => o.id === id)?.text ?? ""
  if (issue.status === "CONFIRMED") {
    if (issue.myOptionId == null) {
      return { Icon: Flag, ink: "text-sub", bg: "bg-surface", title: "결과가 확정됐어요", sub: `정답 · ${text(issue.correctOptionId)}` }
    }
    if (issue.myOptionId === issue.correctOptionId) {
      return {
        Icon: PartyPopper,
        ink: "text-brand",
        bg: "bg-brand-soft",
        title: `맞혔어요! +${scoreDelta ?? 0}`,
        sub: `원금 ${issue.myStake ?? 0} + 수익 ${scoreDelta ?? 0} 돌려받았어요`,
      }
    }
    return { Icon: Frown, ink: "text-sub", bg: "bg-surface", title: "아쉽게 빗나갔어요", sub: `정답 · ${text(issue.correctOptionId)}` }
  }
  return {
    Icon: Hourglass,
    ink: "text-warn-ink",
    bg: "bg-warn-soft",
    title: "마감됐어요 · 결과 대기 중",
    sub:
      issue.myOptionId != null
        ? `내 예측 · ${text(issue.myOptionId)} (${issue.myStake ?? 0} 걸림)`
        : "관리자가 결과를 확정하면 알려드릴게요",
  }
}

export default function IssueDetailPage() {
  const params = useParams<{ id: string }>()
  const issueId = Number(params.id)
  const router = useRouter()
  const showToast = useToast()
  const now = useNow()

  const { data: me } = useMe()
  const { data: issue, isLoading, error } = useIssue(issueId, me?.userId)
  const { data: replies = [] } = useIssueReplies(issueId, issue?.status !== "CONFIRMED")
  const { data: myVotes = [] } = useMyVotes(me?.userId)
  const castVote = useCastVote(issueId)
  const changeVote = useChangeVote(issueId)

  const [sel, setSel] = useState<number | null>(null)
  const [stake, setStake] = useState(100)

  function goBack() {
    if (window.history.length > 1) router.back()
    else router.push("/issue")
  }

  function share() {
    const copy = navigator.clipboard?.writeText(window.location.href) ?? Promise.resolve()
    copy.finally(() => showToast("링크를 복사했어요"))
  }

  if (isLoading || error || !issue) {
    return (
      <div className="py-20 text-center text-sm text-faint">
        {isLoading ? "불러오는 중..." : (error?.message ?? "존재하지 않는 이슈입니다")}
      </div>
    )
  }

  const pct = optionPercents(issue.options)
  // 서버가 아직 OPEN이어도 마감 시각이 지났으면 투표를 닫는다.
  const open = issue.status === "OPEN" && Date.parse(issue.voteDeadlineAt) > now.getTime()
  const myOptionId = issue.myOptionId
  const changing = myOptionId != null
  const ready = sel !== null && sel !== myOptionId
  const credit = me?.credibilityScore ?? 0
  const optionText = (id: number | null) => issue.options.find((o) => o.id === id)?.text ?? ""
  const scoreDelta = myVotes.find((v) => v.issueId === issue.id)?.scoreDelta
  const chip = issueChip(issue, { optionId: myOptionId, scoreDelta }, now)
  const result = open ? null : resultCard(issue, scoreDelta)

  const note = open
    ? changing
      ? `마감 전까지 선택을 바꿀 수 있어요 · ${issue.myStake ?? 0} 걸림`
      : "비율은 실시간으로 반영돼요 · 마감 전까지 선택 변경 가능"
    : "마감된 이슈예요"

  const showStake = open && !changing && sel !== null
  const expected = sel !== null ? payout(pct[sel] ?? 0, issue.options.length, stake) : null
  const expLine = expected
    ? `적중하면 ${stake + expected.win} 돌려받아요 (+${expected.win}) · 빗나가면 ${stake - expected.lose} (-${expected.lose})`
    : ""
  const stakeChoices = [50, 100, 200, Math.max(1, credit)]

  const ctaLabel = !ready
    ? changing
      ? `내 예측 · ${optionText(myOptionId)}`
      : "선택지를 골라주세요"
    : changing
      ? `${optionText(sel)}(으)로 변경하기`
      : `${stake} 걸고 예측하기`

  function pick(optionId: number) {
    if (!open) return
    if (!me) {
      router.push("/login")
      return
    }
    setSel((s) => (s === optionId ? null : optionId))
  }

  function submitVote() {
    if (!me || sel === null || sel === myOptionId || castVote.isPending || changeVote.isPending) return
    const text = optionText(sel)
    if (!changing) {
      if (stake > credit) {
        showToast("보유 신용도가 부족해요")
        return
      }
      castVote.mutate(
        { userId: me.userId, optionId: sel, stake },
        {
          onSuccess: () => {
            setSel(null)
            showToast(`${text}에 ${stake} 걸었어요`)
          },
          onError: (e) => showToast(e.message),
        },
      )
    } else {
      changeVote.mutate(sel, {
        onSuccess: () => {
          setSel(null)
          showToast(`${text}(으)로 변경했어요`)
        },
        onError: (e) => showToast(e.message),
      })
    }
  }

  const options = (size: "mobile" | "pc") =>
    issue.options.map((o) => {
      const isSel = sel === o.id
      const mine = myOptionId === o.id
      const correct = issue.status === "CONFIRMED" && issue.correctOptionId === o.id
      const tag = correct ? "정답" : mine ? (sel !== null && !isSel ? "현재 내 예측" : "내 예측") : ""
      const Icon = isSel ? CircleDot : mine || correct ? CircleCheck : Circle
      const strong = isSel || mine || correct
      return (
        <button
          key={o.id}
          type="button"
          onClick={() => pick(o.id)}
          className={cn(
            "relative flex items-center overflow-hidden bg-surface text-left transition-shadow duration-150",
            size === "mobile" ? "min-h-[54px] gap-2.5 rounded-[15px] px-3.5" : "min-h-[60px] gap-3 rounded-2xl px-[18px]",
            isSel ? "shadow-selected" : "shadow-card",
            open ? "cursor-pointer" : "cursor-default",
          )}
        >
          <div
            className={cn(
              "absolute inset-y-0 left-0 transition-[width] duration-600 ease-out-expo",
              strong ? "bg-brand-fill" : "bg-[#F1F1EF]",
            )}
            style={{ width: `${pct[o.id] ?? 0}%` }}
          />
          <Icon className={cn("relative size-[22px]", strong ? "text-brand" : "text-disabled-ink")} />
          <span className={cn("relative flex-1 font-semibold", size === "mobile" ? "text-[15px]" : "text-base")}>
            {o.text}
          </span>
          {tag && (
            <span
              className={cn(
                "relative rounded-md bg-brand py-[3px] font-bold text-white",
                size === "mobile" ? "px-[7px] text-[11px]" : "px-2 text-xs",
              )}
            >
              {tag}
            </span>
          )}
          <span
            className={cn(
              "relative text-right tabular-nums",
              size === "mobile" ? "min-w-10 text-[15px] font-bold" : "min-w-12 text-[17px] font-extrabold",
            )}
          >
            {pct[o.id] ?? 0}%
          </span>
        </button>
      )
    })

  const stakeChips = (className: string) =>
    stakeChoices.map((value, idx) => (
      <button
        key={idx}
        type="button"
        onClick={() => setStake(value)}
        className={cn(
          "rounded-xl py-[11px] text-center text-sm font-bold tabular-nums",
          className,
          stake === value ? "bg-ink text-white" : cn("bg-track", value > credit ? "text-disabled-ink" : "text-ink"),
        )}
      >
        {idx === 3 ? "전부" : value}
      </button>
    ))

  const cta = (
    <button
      type="button"
      onClick={submitVote}
      className={cn(
        "h-14 w-full rounded-2xl text-base font-bold transition-colors duration-150",
        ready ? "bg-brand text-white" : "bg-disabled-bg text-muted",
      )}
    >
      {ctaLabel}
    </button>
  )

  return (
    <>
      {/* 모바일 */}
      <div className={cn("lg:hidden", open ? "pb-[100px]" : "pb-0")}>
        <div className="sticky top-0 z-20 flex h-[52px] items-center justify-between bg-bg px-3">
          <button type="button" onClick={goBack} className="p-2" aria-label="뒤로">
            <ChevronLeft className="size-6" />
          </button>
          <button type="button" onClick={share} className="p-2" aria-label="공유">
            <Share className="size-[22px]" />
          </button>
        </div>
        <div className="px-4 pb-3.5">
          <ImageBox src={issue.coverImageUrl} className="h-[190px] rounded-[22px]" iconSize={32} />
        </div>
        <div className="flex flex-col gap-2.5 px-5 pt-1">
          <div className="flex items-center gap-2">
            <Chip className={chip.className}>{chip.label}</Chip>
            <span className="text-xs font-semibold text-muted">{formatDateTime(issue.voteDeadlineAt)} 마감</span>
          </div>
          <h1 className="text-2xl leading-[1.35] font-extrabold tracking-[-0.035em] text-pretty">{issue.title}</h1>
          {issue.description && (
            <p className="text-sm leading-[1.65] text-pretty text-sub">{issue.description}</p>
          )}
        </div>
        <div className="flex flex-col gap-2 px-4 pt-5">
          {options("mobile")}
          <span className="px-1 pt-1 text-xs leading-[1.5] text-muted">{note}</span>
        </div>

        {showStake && (
          <div className="mx-4 mt-4 flex flex-col gap-3 rounded-[18px] bg-surface p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[15px] font-bold">걸 신용도</span>
              <span className="text-xs text-muted">보유 {credit.toLocaleString()}</span>
            </div>
            <div className="flex gap-1.5">{stakeChips("flex-1")}</div>
            <span className="text-xs leading-[1.5] text-muted">{expLine}</span>
          </div>
        )}

        {result && (
          <div className={cn("mx-4 mt-4 flex items-center gap-3 rounded-[18px] px-[18px] py-4", result.bg)}>
            <result.Icon className={cn("size-[26px]", result.ink)} />
            <div className="flex flex-1 flex-col gap-[3px]">
              <span className={cn("text-[15px] font-bold", result.ink)}>{result.title}</span>
              <span className="text-[13px] text-sub">{result.sub}</span>
            </div>
          </div>
        )}

        <IssueComments issue={issue} replies={replies} currentUserId={me?.userId} now={now} />

        {open && (
          <div className="fixed inset-x-0 bottom-0 z-30 bg-[linear-gradient(rgba(246,246,244,0),#F6F6F4_30%)] px-4 pt-3 pb-[26px]">
            {cta}
          </div>
        )}
      </div>

      {/* PC */}
      <div className="hidden flex-col gap-[18px] lg:flex">
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-1 self-start text-sm font-semibold text-sub"
        >
          <ChevronLeft className="size-[18px]" />
          목록으로
        </button>
        <div className="grid grid-cols-[minmax(0,1fr)_360px] items-start gap-7">
          <div className="flex flex-col gap-5">
            <ImageBox src={issue.coverImageUrl} className="h-[340px] rounded-[28px]" iconSize={40} />
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Chip className={cn("rounded-lg px-[9px] text-[13px]", chip.className)}>{chip.label}</Chip>
                <span className="flex items-center gap-1 text-[13px] font-semibold text-muted">
                  <Calendar className="size-3.5" />
                  {formatDateTime(issue.voteDeadlineAt)} 마감
                </span>
                <span className="flex-1" />
                <button
                  type="button"
                  onClick={share}
                  className="flex items-center gap-[5px] rounded-[10px] px-2.5 py-1.5 text-[13px] font-semibold text-sub hover:bg-line"
                >
                  <Share className="size-[15px]" />
                  공유
                </button>
              </div>
              <h1 className="text-[32px] leading-[1.3] font-extrabold tracking-[-0.04em] text-pretty">{issue.title}</h1>
              {issue.description && (
                <p className="text-base leading-[1.7] text-pretty text-sub">{issue.description}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">{options("pc")}</div>
            <IssueComments issue={issue} replies={replies} currentUserId={me?.userId} now={now} />
          </div>

          <aside className="sticky top-[92px] flex flex-col gap-3.5">
            <div className="flex flex-col gap-4 rounded-3xl bg-surface p-[22px] shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-lg font-extrabold">예측하기</span>
                {me && (
                  <span className="flex items-center gap-[5px] text-[13px] font-semibold text-sub">
                    <TierIcon tier={me.tier} size={16} />
                    {credit.toLocaleString()}
                  </span>
                )}
              </div>
              <span className="text-[13px] leading-[1.6] text-sub">{note}</span>
              {showStake && (
                <div className="flex flex-col gap-2.5">
                  <span className="text-sm font-bold">걸 신용도</span>
                  <div className="grid grid-cols-4 gap-1.5">{stakeChips("")}</div>
                  <span className="text-xs text-muted">{expLine}</span>
                </div>
              )}
              {open && cta}
              {result && (
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-2xl p-4 shadow-[inset_0_0_0_1px_#EDEDEB]",
                    result.bg,
                  )}
                >
                  <result.Icon className={cn("size-6", result.ink)} />
                  <div className="flex flex-1 flex-col gap-[3px]">
                    <span className={cn("text-[15px] font-bold", result.ink)}>{result.title}</span>
                    <span className="text-[13px] text-sub">{result.sub}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 px-2 text-xs text-muted">
              <EyeOff className="size-3.5" />
              참여 인원은 공개하지 않고 비율만 보여드려요
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
