"use client"

import {
  Activity,
  AlarmClock,
  BadgeCheck,
  CalendarClock,
  ChevronRight,
  FileText,
  Hourglass,
  MessageCircle,
  Siren,
  Users,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"

import { DAY, formatDateTime, leadingOption, optionPercents, remainLabel, useNow } from "@/lib/issues"
import { useAdminReports, useAllAdminIssues, useAllAdminUsers } from "@/lib/queries/admin"
import { cn } from "@/lib/utils"
import { useAdminUI } from "@/components/admin/admin-ui"
import { ActionButton } from "@/components/admin/parts"
import { ImageBox } from "@/components/ui/image-box"

type Kpi = {
  label: string
  value: number
  sub: string
  Icon: LucideIcon
  href: string
  cardClass: string
  iconClass: string
}

export default function AdminDashboardPage() {
  const now = useNow()
  const ui = useAdminUI()
  const { data: issuePage } = useAllAdminIssues()
  const { data: userPage } = useAllAdminUsers()
  const { data: reports = [] } = useAdminReports("PENDING")

  const issues = issuePage?.items ?? []
  const open = issues.filter((i) => i.status === "OPEN")
  const pending = issues.filter((i) => i.status === "PENDING_RESULT")
  const soon = open
    .filter((i) => Date.parse(i.voteDeadlineAt) - now.getTime() < DAY)
    .sort((a, b) => Date.parse(a.voteDeadlineAt) - Date.parse(b.voteDeadlineAt))
  const users = userPage?.items ?? []

  const kpis: Kpi[] = [
    {
      label: "진행 중 이슈",
      value: open.length,
      sub: `마감 임박 ${soon.length}개`,
      Icon: Activity,
      href: "/admin/issues?status=OPEN",
      cardClass: "bg-brand text-white",
      iconClass: "bg-white/18",
    },
    {
      label: "결과 확정 대기",
      value: pending.length,
      sub: "마감 후 정답 확정 필요",
      Icon: Hourglass,
      href: "/admin/issues?status=PENDING_RESULT",
      cardClass: "bg-surface text-ink",
      iconClass: "bg-warn-soft",
    },
    {
      label: "미처리 신고",
      value: reports.length,
      sub: "게시글·댓글 신고",
      Icon: Siren,
      href: "/admin/reports",
      cardClass: "bg-surface text-ink",
      iconClass: "bg-danger-soft",
    },
    {
      label: "전체 회원",
      value: userPage?.totalElements ?? users.length,
      sub: `활동 정지 ${users.filter((u) => u.suspended).length}명`,
      Icon: Users,
      href: "/admin/users",
      cardClass: "bg-surface text-ink",
      iconClass: "bg-track",
    },
  ]

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5">
        {kpis.map((k) => (
          <Link
            key={k.label}
            href={k.href}
            className={cn(
              "flex flex-col gap-3.5 rounded-[22px] px-[22px] py-5 shadow-card transition-transform duration-150 hover:-translate-y-0.5",
              k.cardClass,
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold opacity-75">{k.label}</span>
              <span className={cn("grid size-9 place-items-center rounded-[11px]", k.iconClass)}>
                <k.Icon className="size-[18px]" />
              </span>
            </div>
            <span className="text-[38px] leading-none font-extrabold tracking-[-0.045em] tabular-nums">{k.value}</span>
            <span className="text-xs font-semibold opacity-65">{k.sub}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(380px,1fr))] gap-3.5">
        <Panel
          Icon={Hourglass}
          iconClass="text-warn-ink"
          title="결과 확정 대기"
          extra={
            <span className="rounded-[7px] bg-warn-soft px-2 py-[3px] text-xs font-bold text-warn-ink">
              {pending.length}
            </span>
          }
          empty={pending.length === 0 ? "대기 중인 이슈가 없어요" : undefined}
        >
          {pending.map((i) => {
            const lead = leadingOption(i.options)
            const pct = optionPercents(i.options)
            return (
              <Row key={i.id}>
                <ImageBox src={i.coverImageUrl} className="size-12 flex-none rounded-xl" iconSize={18} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-sm font-semibold">{i.title}</span>
                  <span className="text-xs text-muted">
                    {formatDateTime(i.voteDeadlineAt)} 마감 · 선두 {lead ? `${lead.text} ${pct[lead.id]}%` : "-"}
                  </span>
                </div>
                <ActionButton
                  Icon={BadgeCheck}
                  label="결과 확정"
                  tone="primary"
                  className="px-3.5"
                  onClick={() => ui.askConfirmResult(i)}
                />
              </Row>
            )
          })}
        </Panel>

        <Panel
          Icon={AlarmClock}
          iconClass="text-danger-ink"
          title="마감 임박"
          extra={<span className="text-xs text-muted">24시간 이내</span>}
          empty={soon.length === 0 ? "임박한 이슈가 없어요" : undefined}
        >
          {soon.map((i) => (
            <Row key={i.id}>
              <ImageBox src={i.coverImageUrl} className="size-12 flex-none rounded-xl" iconSize={18} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-sm font-semibold">{i.title}</span>
                <span className="text-xs font-semibold text-danger-ink tabular-nums">
                  {remainLabel(Date.parse(i.voteDeadlineAt) - now.getTime())}
                </span>
              </div>
              <ActionButton Icon={CalendarClock} label="마감 연장" className="px-3.5" onClick={() => ui.askExtend(i)} />
            </Row>
          ))}
        </Panel>

        <Panel
          Icon={Siren}
          iconClass="text-danger-ink"
          title="최근 신고"
          extra={
            <>
              <span className="flex-1" />
              <Link href="/admin/reports" className="flex items-center gap-0.5 text-[13px] font-semibold text-brand">
                전체 보기
                <ChevronRight className="size-[15px]" />
              </Link>
            </>
          }
          empty={reports.length === 0 ? "미처리 신고가 없어요" : undefined}
        >
          {reports.slice(0, 4).map((r) => {
            const Icon = r.kind === "post" ? FileText : MessageCircle
            return (
              <Row key={r.id}>
                <span className="grid size-[34px] flex-none place-items-center rounded-[10px] bg-track text-sub">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{r.excerpt}</span>
                <span className="flex-none text-xs font-semibold text-danger-ink">{r.reason}</span>
              </Row>
            )
          })}
        </Panel>
      </div>
    </>
  )
}

function Panel({
  Icon,
  iconClass,
  title,
  extra,
  empty,
  children,
}: {
  Icon: LucideIcon
  iconClass: string
  title: string
  extra?: React.ReactNode
  empty?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1 rounded-[22px] bg-surface px-[22px] py-5">
      <div className="flex items-center gap-2 pb-2">
        <Icon className={cn("size-[18px]", iconClass)} />
        <span className="text-[17px] font-extrabold">{title}</span>
        {extra}
      </div>
      {children}
      {empty && <span className="py-6 text-center text-[13px] text-faint">{empty}</span>}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-3 border-t border-line-3 py-3">{children}</div>
}
