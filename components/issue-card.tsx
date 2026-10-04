"use client"

import { CircleCheck, Clock } from "lucide-react"
import Link from "next/link"

import type { Issue } from "@/lib/api"
import { issueChip, optionPercents } from "@/lib/issues"
import { cn } from "@/lib/utils"
import { Chip } from "@/components/ui/brand"
import { ImageBox } from "@/components/ui/image-box"

type CardRow = { id: number; text: string; pct: number; mark: boolean; fill: string }

/**
 * 홈 카드에 보여줄 상위 N개 선택지. 강조 대상(확정 이슈는 정답, 아니면 내 선택)이 상위 N개 밖이면
 * 마지막 행을 강조 대상으로 바꾼다. 내 선택이 없으면 선두만 연보라로 칠한다.
 */
function cardRows(issue: Issue, count: number) {
  const pct = optionPercents(issue.options)
  const order = issue.options.map((o) => o.id).sort((a, b) => pct[b] - pct[a])
  const top = order.slice(0, count)
  const highlight = issue.status === "CONFIRMED" ? issue.correctOptionId : issue.myOptionId
  if (highlight != null && !top.includes(highlight)) top[top.length - 1] = highlight
  top.sort((a, b) => pct[b] - pct[a])
  const leader = order[0]
  const rows: CardRow[] = top.map((id) => {
    const mark = id === highlight
    return {
      id,
      text: issue.options.find((o) => o.id === id)?.text ?? "",
      pct: pct[id],
      mark,
      fill: mark ? "bg-brand-mine" : highlight == null && id === leader ? "bg-brand-fill" : "bg-neutral-fill",
    }
  })
  return { rows, hidden: issue.options.length - top.length }
}

/** compact: 홈 허브 캐러셀 카드용(행 34px, 13px 글자). */
function PercentRows({ rows, checkSize, compact }: { rows: CardRow[]; checkSize: string; compact?: boolean }) {
  return (
    <div className={cn("flex flex-col", compact ? "gap-1.5" : "gap-[7px]")}>
      {rows.map((row) => (
        <div
          key={row.id}
          className={cn(
            "relative flex items-center gap-1.5 overflow-hidden bg-track",
            compact ? "h-[34px] rounded-[10px] px-[11px]" : "h-[38px] rounded-[11px] px-3",
          )}
        >
          <div
            className={cn("absolute inset-y-0 left-0 transition-[width] duration-500 ease-out-expo", row.fill)}
            style={{ width: `${row.pct}%` }}
          />
          {row.mark && <CircleCheck className={cn("relative text-brand", checkSize)} />}
          <span
            className={cn(
              "relative flex-1 truncate",
              compact ? "text-[13px]" : "text-sm",
              row.mark ? "font-bold" : "font-semibold",
            )}
          >
            {row.text}
          </span>
          <span className={cn("relative font-bold tabular-nums", compact ? "text-[13px]" : "text-sm")}>
            {row.pct}%
          </span>
        </div>
      ))}
    </div>
  )
}

type IssueCardProps = {
  issue: Issue
  now: Date
  /** 확정 이슈의 "적중 +n" 칩에 쓰는 내 정산 점수 */
  scoreDelta?: number | null
  rowCount?: number
}

/** 모바일 홈 카드 */
export function IssueCardMobile({ issue, now, scoreDelta, rowCount = 2 }: IssueCardProps) {
  const chip = issueChip(issue, { optionId: issue.myOptionId, scoreDelta }, now)
  const { rows, hidden } = cardRows(issue, rowCount)
  return (
    <Link
      href={`/issue/${issue.id}`}
      className="flex flex-col gap-3 rounded-[22px] bg-surface p-[18px] shadow-card active:scale-[.985]"
    >
      <div className="flex items-center justify-between">
        <Chip className={chip.className}>{chip.label}</Chip>
        <span className="text-xs font-semibold text-muted">
          {issue.myOptionId != null ? "참여함" : `선택지 ${issue.options.length}개`}
        </span>
      </div>
      <div className="flex items-center gap-3.5">
        <span className="flex-1 text-[17px] leading-[1.4] font-bold tracking-[-0.02em] text-pretty">
          {issue.title}
        </span>
        <ImageBox src={issue.coverImageUrl} className="size-[60px] flex-none rounded-2xl" iconSize={20} />
      </div>
      <PercentRows rows={rows} checkSize="size-[17px]" />
      {hidden > 0 && <span className="text-xs font-semibold text-faint">외 {hidden}개 선택지</span>}
    </Link>
  )
}

/** PC 홈 카드 — 상단 150px 커버 위에 상태 칩을 얹는다. */
export function IssueCardPc({ issue, now, scoreDelta, rowCount = 2 }: IssueCardProps) {
  const chip = issueChip(issue, { optionId: issue.myOptionId, scoreDelta }, now)
  const { rows, hidden } = cardRows(issue, rowCount)
  return (
    <Link
      href={`/issue/${issue.id}`}
      className="flex flex-col overflow-hidden rounded-3xl bg-surface shadow-card transition-[transform,box-shadow] duration-150 hover:-translate-y-[3px] hover:shadow-card-hover"
    >
      <div className="relative h-[150px]">
        <ImageBox src={issue.coverImageUrl} className="absolute inset-0" iconSize={28} />
        <Chip className={cn("absolute top-3.5 left-3.5 rounded-lg px-[9px]", chip.className)}>{chip.label}</Chip>
      </div>
      <div className="flex flex-col gap-3 px-[18px] pt-4 pb-[18px]">
        <div className="flex justify-between text-xs font-semibold text-muted">
          <span>{issue.myOptionId != null ? "참여함" : `선택지 ${issue.options.length}개`}</span>
          {hidden > 0 && <span>외 {hidden}개</span>}
        </div>
        <span className="min-h-[50px] text-lg leading-[1.4] font-bold tracking-[-0.02em] text-pretty">
          {issue.title}
        </span>
        <PercentRows rows={rows} checkSize="size-4" />
      </div>
    </Link>
  )
}

/** 모바일 홈 허브 "지금 열린 예측" 가로 캐러셀 카드 — 폭 286, 140px 커버 위에 시계 아이콘 + 상태 칩. */
export function IssueCardFeatured({ issue, now, scoreDelta, rowCount = 2 }: IssueCardProps) {
  const chip = issueChip(issue, { optionId: issue.myOptionId, scoreDelta }, now)
  const { rows } = cardRows(issue, rowCount)
  return (
    <Link
      href={`/issue/${issue.id}`}
      className="flex w-[286px] flex-none snap-start flex-col overflow-hidden rounded-3xl bg-surface shadow-card active:scale-[.985]"
    >
      <div className="relative h-[140px]">
        <ImageBox src={issue.coverImageUrl} className="absolute inset-0" iconSize={26} />
        <Chip className={cn("absolute top-3 left-3 flex items-center gap-1", chip.className)}>
          <Clock className="size-3" />
          {chip.label}
        </Chip>
      </div>
      <div className="flex flex-col gap-2.5 px-4 pt-3.5 pb-4">
        <span className="min-h-[45px] text-base leading-[1.4] font-bold tracking-[-0.02em] text-pretty">
          {issue.title}
        </span>
        <PercentRows rows={rows} checkSize="size-[15px]" compact />
      </div>
    </Link>
  )
}
