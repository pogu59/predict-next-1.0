"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useMemo, useState } from "react"

import { ALL_CATEGORY_META, categoryMeta } from "@/lib/categoryMeta"
import { issueStatus, totalVoteCount, useNow, voteRatio } from "@/lib/issues"
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
  return (
    <Suspense fallback={null}>
      <IssuePageContent />
    </Suspense>
  )
}

function IssuePageContent() {
  const router = useRouter()
  const now = useNow()
  const searchParams = useSearchParams()
  const query = searchParams.get("q")?.trim().toLowerCase() ?? ""

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

  const statusFiltered = useMemo(
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

  const list = useMemo(
    () =>
      query
        ? statusFiltered.filter((t) => t.title.toLowerCase().includes(query))
        : statusFiltered,
    [statusFiltered, query],
  )

  const votedCount = visibleIssues.filter(
    (t) => issueStatus(t) === "voted",
  ).length
  const settledCount = visibleIssues.filter(
    (t) => issueStatus(t) === "settled",
  ).length
  const openCount = visibleIssues.filter((t) => {
    const status = issueStatus(t)
    return status === "open" || status === "voted"
  }).length

  /** 히어로에 올릴 이슈: 결과 대기 중이면서 내가 참여한 것 > 결과 대기 중인 것 > 내가 참여한 진행 중인 것 > 그 외 첫 이슈. */
  const featuredIssue = useMemo(() => {
    const pendingVoted = visibleIssues.find(
      (t) => issueStatus(t) === "pending" && t.myOptionId != null,
    )
    if (pendingVoted) return pendingVoted
    const pendingAny = visibleIssues.find((t) => issueStatus(t) === "pending")
    if (pendingAny) return pendingAny
    const votedOpen = visibleIssues.find((t) => issueStatus(t) === "voted")
    if (votedOpen) return votedOpen
    return visibleIssues[0]
  }, [visibleIssues])

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

  const featuredCategoryName = featuredIssue
    ? (categoryNameById[featuredIssue.categoryId] ?? "")
    : ""
  const featuredCat = categoryMeta(featuredCategoryName)
  const featuredStatus = featuredIssue ? issueStatus(featuredIssue) : undefined
  const featuredMyOption = featuredIssue?.options.find(
    (o) => o.id === featuredIssue.myOptionId,
  )
  const featuredRatio =
    featuredIssue && featuredStatus !== "open"
      ? voteRatio(featuredIssue.options)
      : undefined
  const featuredTotal = featuredIssue
    ? totalVoteCount(featuredIssue.options)
    : 0

  return (
    <div className="flex flex-col">
      <nav className="flex items-center gap-0.5 overflow-x-auto border-b border-line px-4 pt-3 sm:px-7">
        {[{ id: "all" as const, name: "전체" }, ...categories].map((c) => {
          const active = c.id === category
          const meta = c.id === "all" ? ALL_CATEGORY_META : categoryMeta(c.name)
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
                  ? "-mb-px flex flex-none items-center gap-[7px] border-b-2 border-ink px-[13px] py-2.5"
                  : "-mb-px flex flex-none items-center gap-[7px] border-b-2 border-transparent px-[13px] py-2.5"
              }
            >
              <Icon name={meta.icon} size={17} style={{ color: meta.color }} />
              <span
                className={
                  active
                    ? "text-[14px] font-extrabold whitespace-nowrap text-ink"
                    : "text-[14px] font-semibold whitespace-nowrap text-ink-muted"
                }
              >
                {c.name}
              </span>
              <span
                className={`text-[12px] font-bold tabular-nums ${active ? "text-ink-subtle" : "text-ink-faint"}`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </nav>

      <div className="flex flex-col gap-[22px] px-4 pt-6 pb-8 sm:px-7 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-[22px]">
          {featuredIssue && (
            <div className="flex flex-col gap-[22px] rounded-[14px] border border-line bg-card p-[22px] shadow-[0_1px_2px_rgba(0,0,0,.04)] sm:flex-row sm:p-[26px]">
              <div className="flex flex-col gap-3.5 sm:w-[340px] sm:flex-none">
                <div className="flex items-center gap-[7px]">
                  <Icon name={featuredCat.icon} size={16} style={{ color: featuredCat.color }} />
                  <span className="text-[12.5px] font-bold text-ink-muted">
                    {featuredCategoryName} ·{" "}
                    {featuredStatus === "settled" ? "확정된 이슈" : "진행 중인 이슈"}
                  </span>
                </div>
                <h2 className="text-pretty text-[27px] leading-[1.3] font-extrabold tracking-[-0.035em] text-ink">
                  {featuredIssue.title}
                </h2>
                {featuredMyOption ? (
                  <div className="flex items-center gap-2 rounded-[10px] border border-line bg-sunken px-[13px] py-[11px]">
                    <Icon name="check_circle" size={18} className="flex-none text-accent" />
                    <span className="text-[12.5px] font-semibold text-ink-muted">내 선택</span>
                    <span className="text-[13.5px] font-extrabold tabular-nums text-ink">
                      {featuredMyOption.text}
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.push(`/issue/${featuredIssue.id}`)}
                    className="flex items-center gap-2 rounded-[10px] border border-line bg-sunken px-[13px] py-[11px] text-left text-[12.5px] font-semibold text-ink-muted transition-colors hover:border-line-strong"
                  >
                    선택지 {featuredIssue.options.length}개 · 눌러서 투표하기 →
                  </button>
                )}
                <span className="text-[12.5px] font-semibold text-ink-subtle">
                  {featuredStatus === "settled"
                    ? "결과가 확정됐어요 · 돈은 걸지 않습니다"
                    : featuredStatus === "pending"
                      ? "결과 판정 예정 · 돈은 걸지 않습니다"
                      : "투표 진행 중 · 돈은 걸지 않습니다"}
                </span>
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-center gap-3.5 border-line pt-3.5 sm:border-l sm:pt-0 sm:pl-7">
                <div className="flex items-center gap-2">
                  {featuredStatus === "pending" ? (
                    <>
                      <Icon name="hourglass_top" filled={false} size={19} className="text-warn" />
                      <span className="text-[14px] font-extrabold text-warn">결과 대기</span>
                    </>
                  ) : featuredStatus === "settled" ? (
                    <>
                      <Icon name="check_circle" size={19} className="text-success" />
                      <span className="text-[14px] font-extrabold text-success">결과 확정</span>
                    </>
                  ) : (
                    <>
                      <Icon name="bolt" size={19} className="text-accent" />
                      <span className="text-[14px] font-extrabold text-accent">투표 진행 중</span>
                    </>
                  )}
                  <div className="flex-auto" />
                  <span className="text-[12.5px] font-bold text-ink-subtle tabular-nums">
                    총 {featuredTotal.toLocaleString()}명 참여
                  </span>
                </div>

                {featuredRatio ? (
                  <div className="flex flex-col gap-[9px]">
                    {featuredIssue.options.map((option) => {
                      const mine = option.id === featuredIssue.myOptionId
                      const pct = featuredRatio[option.id] ?? 0
                      return (
                        <div key={option.id} className="flex items-center gap-3">
                          <span
                            className={`w-[150px] flex-none truncate text-[13px] ${mine ? "font-extrabold text-ink" : "font-semibold text-ink-muted"}`}
                          >
                            {option.text}
                          </span>
                          <div
                            className={`h-[10px] flex-1 overflow-hidden rounded-full ${mine ? "bg-hot" : "bg-track"}`}
                          >
                            <div
                              className={`h-full rounded-full ${mine ? "bg-accent" : "bg-fill-neutral"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span
                            className={`w-11 flex-none text-right text-[13px] tabular-nums ${mine ? "font-extrabold text-ink" : "font-bold text-ink-muted"}`}
                          >
                            {(option.voteCount ?? 0).toLocaleString()}명
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-[13px] font-semibold text-ink-subtle">
                    아직 투표하지 않아 구간별 분포가 보이지 않아요.
                  </p>
                )}
                <span className="text-[11.5px] font-semibold text-ink-subtle">
                  구간별 참여자 분포 · 판정 후 신용도 반영
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3.5">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-2">
              <h1 className="text-[21px] font-extrabold tracking-[-0.035em] text-ink">
                진행 중인 이슈
              </h1>
              <span className="text-[13px] font-semibold text-ink-subtle tabular-nums">
                {statusCounts.all}건 · 참여 완료 {votedCount}건
              </span>
              <div className="flex-auto" />
              <div className="flex gap-1 rounded-[10px] bg-track p-1">
                {STATUS_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setStatusFilter(tab.value)}
                    className={
                      statusFilter === tab.value
                        ? "rounded-[7px] bg-card px-3 py-[7px] text-[12.5px] font-extrabold text-ink tabular-nums shadow-[0_1px_2px_rgba(0,0,0,.06)]"
                        : "rounded-[7px] px-3 py-[7px] text-[12.5px] font-semibold text-ink-subtle tabular-nums hover:text-ink"
                    }
                  >
                    {tab.label} {statusCounts[tab.value]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                {query
                  ? "검색 결과가 없어요"
                  : "이 카테고리에 이슈가 없어요"}
              </div>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-4 lg:w-[308px] lg:flex-none">
          {me ? (
            <div className="flex flex-col gap-3.5 rounded-[14px] bg-accent p-5">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-extrabold text-[color:color-mix(in_oklab,var(--accent-ink)_72%,transparent)]">
                  내 신용도 · {tierLabel(me.tier)}
                </span>
                <div className="flex-auto" />
                {tierIcon(me.tier, 22)}
              </div>
              <span className="text-[44px] leading-none font-extrabold tracking-[-0.05em] text-accent-ink tabular-nums">
                {score.toLocaleString()}
              </span>
              <div className="h-2 overflow-hidden rounded-full bg-[color:color-mix(in_oklab,var(--accent-ink)_20%,transparent)]">
                <div
                  className="h-full rounded-full bg-accent-ink"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              {progress.nextTier && (
                <span className="text-[12.5px] font-extrabold text-[color:color-mix(in_oklab,var(--accent-ink)_78%,transparent)] tabular-nums">
                  {tierLabel(progress.nextTier)}까지 {progress.nextAt! - score}점
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2 rounded-[14px] border border-dashed border-line-strong p-5">
              <span className="text-label">로그인하고 참여해보세요</span>
              <a href="/login" className="text-caption text-accent">
                로그인하러 가기
              </a>
            </div>
          )}

          <div className="flex flex-col gap-3.5 rounded-[14px] border border-line bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)]">
            <span className="text-[13px] font-extrabold text-ink">내 참여 현황</span>
            <div className="flex items-center gap-2.5">
              <span className="flex-auto text-[13px] font-semibold text-ink-muted">진행 중인 이슈</span>
              <span className="text-[14px] font-extrabold tabular-nums text-ink">{openCount}건</span>
            </div>
            <div className="h-px bg-line" />
            <div className="flex items-center gap-2.5">
              <span className="flex-auto text-[13px] font-semibold text-ink-muted">참여 완료</span>
              <span className="text-[14px] font-extrabold tabular-nums text-ink">{votedCount}건</span>
            </div>
            <div className="h-px bg-line" />
            <div className="flex items-center gap-2.5">
              <span className="flex-auto text-[13px] font-semibold text-ink-muted">확정</span>
              <span className="text-[14px] font-extrabold tabular-nums text-ink">{settledCount}건</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-sunken p-5">
            <span className="text-[12.5px] font-extrabold text-ink">돈은 걸지 않습니다</span>
            <span className="text-[12px] leading-[1.65] font-medium text-pretty text-ink-muted">
              현금·코인·아이템 없이 신용도 점수와 티어만 오갑니다.
            </span>
          </div>
        </aside>
      </div>
    </div>
  )
}
