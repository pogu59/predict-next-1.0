"use client"

import { AlarmClock, BadgeCheck, Clock, Hourglass, Search, type LucideIcon } from "lucide-react"

import type { AdminIssueListItem } from "@/lib/api"
import { DAY, remainLabel } from "@/lib/issues"
import { cn } from "@/lib/utils"

export type SegTab<K extends string> = { key: K; label: string; count: number }

/** 흰 바탕 세그먼트 탭(활성 #111113). */
export function SegTabs<K extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: SegTab<K>[]
  value: K
  onChange: (key: K) => void
  className?: string
}) {
  return (
    <div className={cn("flex gap-1 rounded-[14px] bg-surface p-1", className)}>
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={cn(
            "flex gap-1.5 rounded-[10px] px-3.5 py-[9px] text-[13px] font-bold",
            value === t.key ? "bg-ink text-white" : "text-sub",
          )}
        >
          {t.label}
          <span className="tabular-nums opacity-55">{t.count}</span>
        </button>
      ))}
    </div>
  )
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="flex h-11 w-[280px] max-w-full items-center gap-2 rounded-[14px] bg-surface px-3.5">
      <Search className="size-[18px] text-faint" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none"
      />
    </div>
  )
}

/** 관리자 카드의 상태 칩 — 아이콘을 함께 붙이고, 진행 중 D-n은 흰 배경을 쓴다(커버 위에 얹힘). */
export function adminIssueChip(issue: AdminIssueListItem, now: Date): {
  label: string
  className: string
  Icon: LucideIcon
} {
  if (issue.status === "CONFIRMED") return { label: "확정", className: "bg-ink text-white", Icon: BadgeCheck }
  if (issue.status === "PENDING_RESULT") {
    return { label: "결과 대기", className: "bg-warn-soft text-warn-ink", Icon: Hourglass }
  }
  const ms = Date.parse(issue.voteDeadlineAt) - now.getTime()
  return ms < DAY
    ? { label: remainLabel(ms), className: "bg-danger-soft text-danger-ink", Icon: AlarmClock }
    : { label: remainLabel(ms), className: "bg-surface text-brand", Icon: Clock }
}

type ActionTone = "primary" | "danger" | "outline"

const ACTION_TONE: Record<ActionTone, string> = {
  primary: "bg-ink text-white",
  danger: "bg-danger-soft text-danger-ink",
  outline: "border-[1.5px] border-line-2 bg-surface text-ink",
}

export function ActionButton({
  Icon,
  label,
  tone = "outline",
  onClick,
  className,
}: {
  Icon: LucideIcon
  label: string
  tone?: ActionTone
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-9 items-center gap-[5px] rounded-[10px] px-3 text-[13px] font-bold",
        ACTION_TONE[tone],
        className,
      )}
    >
      <Icon className="size-[15px]" />
      {label}
    </button>
  )
}

export function EmptyState({ text, className }: { text: string; className?: string }) {
  return <div className={cn("py-20 text-center text-sm text-faint", className)}>{text}</div>
}
