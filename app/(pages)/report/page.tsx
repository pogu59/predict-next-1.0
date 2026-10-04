"use client"

import Link from "next/link"

import {
  ChevronRight,
  Compass,
  FingerprintPattern,
  History,
  Hourglass,
  Scale,
  Sparkles,
} from "lucide-react"

import { crowdReport, type CrowdRow } from "@/lib/insights"
import { formatDate, formatDateTime, optionPercents } from "@/lib/issues"
import { useMe } from "@/lib/queries/auth"
import { useIssues } from "@/lib/queries/issue"
import { cn } from "@/lib/utils"

const TILE_LIMIT = 40

/** 결과 리포트 — 확정된 예측으로 "다수가 맞혔나, 뭐가 의외였나"를 돌아본다. */
export default function ReportPage() {
  const { data: me } = useMe()
  const { data: issues = [], isLoading, error } = useIssues(me?.userId)
  const report = crowdReport(issues)

  return (
    <div className="pb-[100px] lg:pb-0">
      <div className="flex flex-col gap-1 px-5 pt-2 pb-4 lg:px-0 lg:pt-0 lg:pb-[18px]">
        <h1 className="text-2xl font-extrabold tracking-[-0.04em] lg:text-[30px]">
          리포트
        </h1>
        <span className="text-sm text-sub lg:text-[15px]">
          확정된 예측으로 돌아보는 다수의 감
        </span>
      </div>

      {isLoading || error ? (
        <div className="py-[60px] text-center text-sm text-faint">
          {error ? error.message : "불러오는 중..."}
        </div>
      ) : report.rows.length === 0 ? (
        <div className="px-4 lg:px-0">
          <div className="flex flex-col items-start gap-1.5 rounded-3xl bg-surface p-6">
            <span className="text-lg font-extrabold tracking-[-0.02em]">
              아직 확정된 예측이 없어요
            </span>
            <span className="text-sm leading-[1.6] text-sub">
              결과가 확정되면 다수가 맞혔는지, 어떤 결과가 의외였는지 여기에서
              돌아볼 수 있어요.
            </span>
            <Link
              href="/issue"
              className="mt-2.5 flex h-11 items-center rounded-[13px] bg-ink px-4 text-sm font-bold text-white"
            >
              진행 중인 예측 보기
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 px-4 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-7 lg:px-0">
          <div className="flex flex-col gap-4">
            {report.upsets[0] ? (
              <UpsetHero row={report.upsets[0]} />
            ) : (
              <NoUpsetHero total={report.rows.length} />
            )}
            {report.upsets.length > 1 && (
              <UpsetList rows={report.upsets.slice(1, 6)} />
            )}
            {report.closest.length > 0 && <ClosestList rows={report.closest} />}
          </div>
          <aside className="flex flex-col gap-4 lg:sticky lg:top-[92px]">
            <CrowdTiles
              rows={report.rows}
              rightCount={report.crowdRightCount}
              accuracy={report.accuracy}
            />
            {report.pending.length > 0 && (
              <PendingList issues={report.pending.slice(0, 4)} />
            )}
            <ReportLinks />
          </aside>
        </div>
      )}
    </div>
  )
}

function Card({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      className={cn("flex flex-col rounded-3xl bg-surface p-5", className)}
    >
      {children}
    </section>
  )
}

function CardTitle({
  Icon,
  children,
}: {
  Icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <h2 className="flex items-center gap-[7px] pb-3 text-base font-extrabold tracking-[-0.02em]">
      {Icon && <Icon className="size-[18px] text-brand" />}
      {children}
    </h2>
  )
}

/** 가장 의외였던 결과 — 페이지에서 유일한 어두운 면. */
function UpsetHero({ row }: { row: CrowdRow }) {
  const { issue } = row
  const pct = optionPercents(issue.options)
  const options = [...issue.options].sort((a, b) => pct[b.id] - pct[a.id])
  return (
    <Link
      href={`/issue/${issue.id}`}
      className="flex flex-col gap-4 rounded-3xl bg-ink p-6 text-white lg:p-8"
    >
      <span className="flex items-center gap-1.5 text-sm font-bold text-brand-on-dark">
        <Sparkles className="size-4" />
        가장 의외였던 결과
      </span>
      <div className="flex items-end gap-2">
        <span className="text-[56px] leading-none font-extrabold tracking-[-0.045em] tabular-nums lg:text-[72px]">
          {row.correctPct}%
        </span>
        <span className="pb-1.5 text-lg font-bold">만 맞혔어요</span>
      </div>
      <span className="text-lg leading-[1.4] font-bold tracking-[-0.02em] text-pretty lg:text-xl">
        {issue.title}
      </span>
      <div className="flex flex-col gap-1.5">
        {options.map((o) => {
          const correct = o.id === issue.correctOptionId
          return (
            <div
              key={o.id}
              className="relative flex h-[38px] items-center gap-2 overflow-hidden rounded-[11px] bg-white/8 px-3"
            >
              <div
                className={cn(
                  "absolute inset-y-0 left-0",
                  correct ? "bg-brand" : "bg-white/14",
                )}
                style={{ width: `${pct[o.id]}%` }}
              />
              <span
                className={cn(
                  "relative flex-1 truncate text-sm",
                  correct ? "font-bold" : "font-semibold",
                )}
              >
                {o.text}
              </span>
              {correct && (
                <span className="relative rounded-md bg-white px-1.5 py-0.5 text-[11px] font-bold text-brand">
                  정답
                </span>
              )}
              <span className="relative text-sm font-bold tabular-nums">
                {pct[o.id]}%
              </span>
            </div>
          )
        })}
      </div>
      <span className="text-xs font-semibold text-white/60">
        {formatDate(issue.confirmedAt ?? issue.voteDeadlineAt)} 확정 · 최종 비율
        기준
      </span>
    </Link>
  )
}

function NoUpsetHero({ total }: { total: number }) {
  return (
    <Card className="gap-1.5 p-6">
      <span className="text-xl font-extrabold tracking-[-0.03em]">
        이번엔 반전이 없었어요
      </span>
      <span className="text-[15px] font-semibold text-sub">
        확정된 {total}건 모두 다수 의견이 맞혔어요
      </span>
      <span className="pt-1 text-sm leading-[1.6] text-muted">
        다수 쪽을 맞히면 보상이 작아요. 다음엔 접전 이슈에서 소수 의견을
        노려보세요.
      </span>
    </Card>
  )
}

function UpsetList({ rows }: { rows: CrowdRow[] }) {
  return (
    <Card className="pb-2">
      <CardTitle>다수가 빗나간 예측</CardTitle>
      {rows.map((row, i) => (
        <Link
          key={row.issue.id}
          href={`/issue/${row.issue.id}`}
          className={cn(
            "flex flex-col gap-1 py-3",
            i > 0 && "border-t border-line-3",
          )}
        >
          <span className="text-[15px] leading-[1.4] font-bold">
            {row.issue.title}
          </span>
          <span className="flex flex-wrap gap-x-2.5 text-[13px] tabular-nums">
            <span className="text-sub">
              정답 <b className="font-bold text-brand">{row.correctText}</b>{" "}
              {row.correctPct}%
            </span>
            <span className="text-muted">
              다수 {row.leaderText} {row.leaderPct}%
            </span>
          </span>
        </Link>
      ))}
    </Card>
  )
}

function ClosestList({ rows }: { rows: CrowdRow[] }) {
  return (
    <Card className="pb-2">
      <CardTitle Icon={Scale}>한 끗 차이였던 예측</CardTitle>
      {rows.map((row, i) => {
        const { issue } = row
        const pct = optionPercents(issue.options)
        const [a, b] = [...issue.options].sort((x, y) => pct[y.id] - pct[x.id])
        const sum = pct[a.id] + pct[b.id]
        const aWidth = sum ? (pct[a.id] / sum) * 100 : 50
        return (
          <Link
            key={issue.id}
            href={`/issue/${issue.id}`}
            className={cn(
              "flex flex-col gap-2 py-3",
              i > 0 && "border-t border-line-3",
            )}
          >
            <span className="flex items-start gap-3">
              <span className="flex-1 text-[15px] leading-[1.4] font-bold">
                {issue.title}
              </span>
              <span className="flex-none pt-0.5 text-[13px] font-bold text-sub tabular-nums">
                {row.margin}%p 차이
              </span>
            </span>
            <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
              <div
                className={
                  a.id === issue.correctOptionId
                    ? "bg-brand"
                    : "bg-neutral-fill"
                }
                style={{ width: `${aWidth}%` }}
              />
              <div
                className={cn(
                  "flex-1",
                  b.id === issue.correctOptionId
                    ? "bg-brand"
                    : "bg-neutral-fill",
                )}
              />
            </div>
            <span className="flex justify-between gap-3 text-xs font-semibold tabular-nums">
              {[a, b].map((o) => (
                <span
                  key={o.id}
                  className={cn(
                    "truncate",
                    o.id === issue.correctOptionId
                      ? "text-brand"
                      : "text-muted",
                  )}
                >
                  {o.text} {pct[o.id]}%
                </span>
              ))}
            </span>
          </Link>
        )
      })}
    </Card>
  )
}

/** 확정 이슈 1건 = 타일 1개. 다수 적중은 연보라, 반전은 히어로와 같은 검정. */
function CrowdTiles({
  rows,
  rightCount,
  accuracy,
}: {
  rows: CrowdRow[]
  rightCount: number
  accuracy: number | null
}) {
  const tiles = rows.slice(0, TILE_LIMIT).reverse()
  return (
    <Card>
      <CardTitle>다수의 감</CardTitle>
      <span className="pb-3 text-sm leading-[1.6] text-sub">
        확정된 {rows.length}건 중 {rightCount}건은 비율 1위가 정답이었어요 (
        {accuracy ?? 0}%)
      </span>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(26px,1fr))] gap-1.5">
        {tiles.map((row) => {
          const label = `${row.issue.title} — ${row.crowdRight ? "다수 적중" : "반전"}`
          return (
            <Link
              key={row.issue.id}
              href={`/issue/${row.issue.id}`}
              aria-label={label}
              title={label}
              className={cn(
                "aspect-square rounded-md",
                row.crowdRight ? "bg-brand-fill" : "bg-ink",
              )}
            />
          )
        })}
      </div>
      <div className="flex gap-3.5 pt-3 text-xs font-semibold text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-brand-fill" />
          다수 적중
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-ink" />
          반전
        </span>
      </div>
    </Card>
  )
}

function PendingList({
  issues,
}: {
  issues: { id: number; title: string; voteDeadlineAt: string }[]
}) {
  return (
    <Card className="pb-2">
      <CardTitle Icon={Hourglass}>곧 결과가 나와요</CardTitle>
      {issues.map((issue, i) => (
        <Link
          key={issue.id}
          href={`/issue/${issue.id}`}
          className={cn(
            "flex flex-col gap-0.5 py-2.5",
            i > 0 && "border-t border-line-3",
          )}
        >
          <span className="truncate text-sm font-bold">{issue.title}</span>
          <span className="text-xs font-semibold text-muted">
            {formatDateTime(issue.voteDeadlineAt)} 마감
          </span>
        </Link>
      ))}
    </Card>
  )
}

const REPORT_LINKS = [
  { href: "/my/dna", label: "내 예측 성향 보기", Icon: FingerprintPattern },
  { href: "/guide", label: "점수 계산법", Icon: Compass },
  { href: "/rewind", label: "리와인드로 감 연습하기", Icon: History },
]

function ReportLinks() {
  return (
    <Card className="gap-0 px-2 py-1.5">
      {REPORT_LINKS.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-track"
        >
          <Icon className="size-[18px] text-brand" />
          <span className="flex-1 text-[15px] font-bold">{label}</span>
          <ChevronRight className="size-[18px] text-disabled-ink" />
        </Link>
      ))}
    </Card>
  )
}
