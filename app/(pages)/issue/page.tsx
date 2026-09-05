"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

import { ALL_CATEGORY_META, categoryMeta } from "@/lib/categoryMeta"
import { formatRemaining, issueStatus, useNow } from "@/lib/issues"
import { useMe } from "@/lib/queries/auth"
import { useCategories } from "@/lib/queries/category"
import { useIssues } from "@/lib/queries/issue"
import { tierIcon, tierLabel, tierProgress } from "@/lib/tier"
import { Icon } from "@/components/icon"
import { IssueCard } from "@/components/issueCard"

type StatusFilter = "all" | "open" | "settled"

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "open", label: "진행 중" },
  { value: "settled", label: "확정" },
]

export default function IssuePage() {
  const router = useRouter()
  const now = useNow()
  const [category, setCategory] = useState<number | "all">("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  const { data: me } = useMe()
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories()
  const { data: issues = [], isLoading: issuesLoading, error: issuesError } = useIssues(me?.userId)

  const loading = categoriesLoading || issuesLoading
  const error = categoriesError || issuesError

  const categoryNameById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  )

  /** 진행 중인 이슈는 전부, 마감/확정 이슈는 본인이 참여한 것만 남긴다. */
  const visibleIssues = useMemo(
    () =>
      issues.filter((t) => {
        const status = issueStatus(t)
        return status === "open" || status === "voted" || t.myOptionId != null
      }),
    [issues],
  )

  const categoryFiltered = useMemo(
    () =>
      category === "all"
        ? visibleIssues
        : visibleIssues.filter((t) => t.categoryId === category),
    [category, visibleIssues],
  )

  const list = useMemo(
    () =>
      statusFilter === "all"
        ? categoryFiltered
        : categoryFiltered.filter((t) => {
            const status = issueStatus(t)
            return statusFilter === "open"
              ? status === "open" || status === "voted"
              : status === "pending" || status === "settled"
          }),
    [categoryFiltered, statusFilter],
  )

  const statusCounts = useMemo(() => {
    let open = 0
    let settled = 0
    for (const t of categoryFiltered) {
      const status = issueStatus(t)
      if (status === "open" || status === "voted") open++
      else settled++
    }
    return { all: categoryFiltered.length, open, settled }
  }, [categoryFiltered])

  const upcomingCloses = useMemo(
    () =>
      visibleIssues
        .filter((t) => {
          const status = issueStatus(t)
          return status === "open" || status === "voted"
        })
        .slice()
        .sort(
          (a, b) =>
            new Date(a.voteDeadlineAt).getTime() -
            new Date(b.voteDeadlineAt).getTime(),
        )
        .slice(0, 3),
    [visibleIssues],
  )

  const votedCount = visibleIssues.filter(
    (t) => issueStatus(t) === "voted",
  ).length

  const score = me?.credibilityScore ?? 0
  const progress = tierProgress(score)

  if (loading) {
    return (
      <div className="flex flex-col gap-5 px-6 pt-8 pb-11">
        <div className="text-label text-ink-subtle">불러오는 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-5 px-6 pt-8 pb-11">
        <div className="rounded-xl border border-dashed border-line-strong px-5 py-10 text-center text-label text-ink-subtle">
          {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-8 pb-11 sm:px-6">
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[200px_1fr_266px] lg:gap-8">
        <div className="flex flex-col gap-3">
          <div className="text-label tracking-wider text-ink-subtle">
            카테고리
          </div>
          <nav className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {[{ id: "all" as const, name: "전체" }, ...categories].map((c) => {
              const active = c.id === category
              const meta =
                c.id === "all" ? ALL_CATEGORY_META : categoryMeta(c.name)
              const count =
                c.id === "all"
                  ? visibleIssues.length
                  : visibleIssues.filter((i) => i.categoryId === c.id).length
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={
                    active
                      ? "flex flex-none items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-label leading-none whitespace-nowrap text-bg"
                      : "flex flex-none items-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-label leading-none whitespace-nowrap text-ink-muted transition-colors hover:text-ink"
                  }
                >
                  <Icon
                    name={meta.icon}
                    size={17}
                    style={{ color: active ? "var(--bg)" : meta.color }}
                  />
                  <span className="flex-auto text-left">{c.name}</span>
                  <span
                    className={`text-caption tabular-nums ${
                      active
                        ? "text-[color-mix(in_oklab,var(--bg)_50%,transparent)]"
                        : "text-ink-faint"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-2">
            <h1 className="text-h1">진행 중인 이슈</h1>
            <span className="text-caption text-ink-subtle tabular-nums">
              {list.length}건 · 참여 완료 {votedCount}건
            </span>
            <div className="flex-auto" />
            <div className="flex gap-1 rounded-lg bg-sunken p-1">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                  className={
                    statusFilter === tab.value
                      ? "rounded-md bg-ink px-2.5 py-1.5 text-label text-bg tabular-nums"
                      : "rounded-md px-2.5 py-1.5 text-label text-ink-subtle tabular-nums hover:text-ink"
                  }
                >
                  {tab.label} {statusCounts[tab.value]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-[13px]">
            {list.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                categoryName={categoryNameById[issue.categoryId] ?? ""}
                onOpen={(id) => router.push(`/issue/${id}`)}
              />
            ))}
          </div>

          {list.length === 0 && (
            <div className="rounded-xl border border-dashed border-line-strong px-5 py-10 text-center text-label text-ink-subtle">
              이 카테고리에 진행 중인 이슈가 없어요
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-[13px]">
          {me ? (
            <div
              className="flex flex-col gap-3 rounded-2xl p-[17px]"
              style={{
                background:
                  "linear-gradient(105deg, var(--accent), var(--accent-deep))",
              }}
            >
              <span className="flex items-center text-caption text-[color:color-mix(in_oklab,var(--accent-ink)_62%,transparent)]">
                내 신용도 · {tierLabel(me.tier)} {tierIcon(me.tier)}
              </span>
              <span className="text-title1 text-accent-ink tabular-nums">
                {score.toLocaleString()}
              </span>
              <div className="h-[5px] overflow-hidden rounded-full bg-[color:color-mix(in_oklab,var(--accent-ink)_22%,transparent)]">
                <div
                  className="h-full bg-accent-ink"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              {progress.nextTier && (
                <span className="text-caption text-[color:color-mix(in_oklab,var(--accent-ink)_65%,transparent)] tabular-nums">
                  {tierLabel(progress.nextTier)}까지 {progress.nextAt! - score}
                  점
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-line-strong p-[17px]">
              <span className="text-label">로그인하고 참여해보세요</span>
              <a href="/login" className="text-caption text-accent">
                로그인하러 가기
              </a>
            </div>
          )}

          {upcomingCloses.length > 0 && (
            <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-[17px]">
              <span className="text-label text-ink-subtle">
                곧 마감되는 이슈
              </span>
              {upcomingCloses.map((issue, i) => (
                <div key={issue.id} className="flex flex-col gap-3">
                  {i > 0 && <div className="h-px bg-line" />}
                  <div className="flex flex-col gap-1">
                    <span className="text-label">{issue.title}</span>
                    <span className="text-caption text-accent tabular-nums">
                      {formatRemaining(issue.voteDeadlineAt, now)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
