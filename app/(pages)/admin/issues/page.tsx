"use client"

import { BadgeCheck, Calendar, CalendarClock, CircleCheck, Pencil, Trash2 } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"

import type { AdminIssueListItem, BackendIssueStatus } from "@/lib/api"
import { formatDateTime, optionPercents, useNow } from "@/lib/issues"
import { useAllAdminIssues } from "@/lib/queries/admin"
import { cn } from "@/lib/utils"
import { useAdminUI } from "@/components/admin/admin-ui"
import { ActionButton, adminIssueChip, EmptyState, SearchBox, SegTabs } from "@/components/admin/parts"
import { ImageBox } from "@/components/ui/image-box"

type StatusFilter = "all" | BackendIssueStatus

const STATUS_FILTERS: StatusFilter[] = ["all", "OPEN", "PENDING_RESULT", "CONFIRMED"]
const STATUS_LABEL: Record<StatusFilter, string> = {
  all: "전체",
  OPEN: "진행 중",
  PENDING_RESULT: "결과 대기",
  CONFIRMED: "확정",
}

function parseStatus(value: string | null): StatusFilter {
  return STATUS_FILTERS.includes(value as StatusFilter) ? (value as StatusFilter) : "all"
}

function AdminIssues() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const status = parseStatus(searchParams.get("status"))
  const [query, setQuery] = useState("")
  const now = useNow()
  const { data, isLoading, error } = useAllAdminIssues()

  const issues = data?.items ?? []
  const q = query.trim()
  const list = issues.filter((i) => (status === "all" || i.status === status) && (!q || i.title.includes(q)))

  const tabs = STATUS_FILTERS.map((key) => ({
    key,
    label: STATUS_LABEL[key],
    count: key === "all" ? issues.length : issues.filter((i) => i.status === key).length,
  }))

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <SegTabs
          tabs={tabs}
          value={status}
          onChange={(key) => router.replace(key === "all" ? pathname : `${pathname}?status=${key}`)}
        />
        <div className="flex-1" />
        <SearchBox value={query} onChange={setQuery} placeholder="이슈 제목 검색" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-3.5">
        {list.map((issue) => (
          <IssueCard key={issue.id} issue={issue} now={now} />
        ))}
      </div>
      {list.length === 0 && (
        <EmptyState text={error ? error.message : isLoading ? "불러오는 중..." : "해당하는 이슈가 없어요"} />
      )}
    </>
  )
}

function IssueCard({ issue, now }: { issue: AdminIssueListItem; now: Date }) {
  const ui = useAdminUI()
  const chip = adminIssueChip(issue, now)
  const pct = optionPercents(issue.options)
  const settled = issue.status === "CONFIRMED"
  const leader = issue.options.reduce<number | undefined>(
    (best, o) => (best === undefined || pct[o.id] > pct[best] ? o.id : best),
    undefined,
  )

  return (
    <div className="flex flex-col overflow-hidden rounded-[22px] bg-surface shadow-card">
      <div className="relative h-[132px]">
        <ImageBox src={issue.coverImageUrl} className="absolute inset-0" iconSize={28} />
        <span
          className={cn(
            "absolute top-3.5 left-3.5 flex items-center gap-1 rounded-[7px] px-2 py-[5px] text-xs font-bold tabular-nums",
            chip.className,
          )}
        >
          <chip.Icon className="size-[13px]" />
          {chip.label}
        </span>
      </div>
      <div className="flex flex-col gap-3 px-5 pt-4 pb-[18px]">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
          <Calendar className="size-3.5" />
          <span className="tabular-nums">{formatDateTime(issue.voteDeadlineAt)} 마감</span>
          <span className="flex-1" />
          <span className="text-disabled-ink">#{issue.id}</span>
        </div>
        <span className="min-h-12 text-[17px] leading-[1.4] font-bold tracking-[-0.02em]">{issue.title}</span>
        <div className="flex flex-col gap-[7px]">
          {issue.options.map((o) => {
            const correct = settled && issue.correctOptionId === o.id
            const highlight = settled ? correct : o.id === leader && pct[o.id] > 0
            return (
              <div key={o.id} className="flex items-center gap-2.5 text-[13px]">
                <span
                  className={cn(
                    "flex w-[110px] flex-none items-center gap-1 truncate",
                    highlight ? "font-bold text-ink" : "font-medium text-sub",
                  )}
                >
                  {correct && <CircleCheck className="size-3.5 flex-none text-brand" />}
                  <span className="truncate">{o.text}</span>
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded bg-track">
                  <span
                    className={cn("block h-full rounded", highlight ? "bg-brand" : "bg-[#C9C6F5]")}
                    style={{ width: `${pct[o.id]}%` }}
                  />
                </span>
                <span className="w-[38px] text-right font-bold tabular-nums">{pct[o.id]}%</span>
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-1.5 border-t border-line-3 pt-3.5">
          {issue.status === "OPEN" && (
            <>
              <ActionButton Icon={Pencil} label="수정" onClick={() => ui.openEdit(issue.id)} />
              <ActionButton Icon={CalendarClock} label="마감 연장" onClick={() => ui.askExtend(issue)} />
            </>
          )}
          {issue.status === "PENDING_RESULT" && (
            <>
              <ActionButton Icon={BadgeCheck} label="결과 확정" tone="primary" onClick={() => ui.askConfirmResult(issue)} />
              <ActionButton Icon={CalendarClock} label="마감 연장" onClick={() => ui.askExtend(issue)} />
            </>
          )}
          <ActionButton Icon={Trash2} label="삭제" tone="danger" onClick={() => ui.askDelete(issue)} />
        </div>
      </div>
    </div>
  )
}

export default function AdminIssuesPage() {
  return (
    <Suspense>
      <AdminIssues />
    </Suspense>
  )
}
