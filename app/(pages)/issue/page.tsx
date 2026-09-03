"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import {
  ApiError,
  castVote,
  fetchCategories,
  fetchTopics,
  type Category,
  type Topic,
} from "@/lib/api"
import { fetchMe, type Me } from "@/lib/auth"
import { ALL_CATEGORY_META, categoryMeta } from "@/lib/categoryMeta"
import {
  formatRemaining,
  loadLocalVotes,
  saveLocalVote,
  toUiIssue,
  useNow,
  type LocalVote,
} from "@/lib/issues"
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
  const [categories, setCategories] = useState<Category[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [me, setMe] = useState<Me | null>(null)
  const [localVotes, setLocalVotes] = useState<Record<number, LocalVote>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [voteError, setVoteError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [cats, tops, meResult] = await Promise.all([
          fetchCategories(),
          fetchTopics(),
          fetchMe(),
        ])
        if (cancelled) return
        setCategories(cats)
        setTopics(tops)
        setMe(meResult)
        if (meResult) setLocalVotes(loadLocalVotes(meResult.userId))
      } catch (e) {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : "이슈를 불러오지 못했습니다",
          )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const categoryNameById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  )

  const issues = useMemo(
    () => topics.map((t) => toUiIssue(t, localVotes[t.id])),
    [topics, localVotes],
  )

  /** 진행 중인 이슈는 전부, 마감/확정 이슈는 본인이 참여한 것만 남긴다. */
  const visibleIssues = useMemo(
    () =>
      issues.filter(
        (i) =>
          i.status === "open" ||
          i.status === "voted" ||
          i.myOptionId !== undefined,
      ),
    [issues],
  )

  const categoryFiltered = useMemo(
    () =>
      category === "all"
        ? visibleIssues
        : visibleIssues.filter((i) => i.categoryId === category),
    [category, visibleIssues],
  )

  const list = useMemo(
    () =>
      statusFilter === "all"
        ? categoryFiltered
        : categoryFiltered.filter((i) =>
            statusFilter === "open"
              ? i.status === "open" || i.status === "voted"
              : i.status === "pending" || i.status === "settled",
          ),
    [categoryFiltered, statusFilter],
  )

  const statusCounts = useMemo(
    () => ({
      all: categoryFiltered.length,
      open: categoryFiltered.filter(
        (i) => i.status === "open" || i.status === "voted",
      ).length,
      settled: categoryFiltered.filter(
        (i) => i.status === "pending" || i.status === "settled",
      ).length,
    }),
    [categoryFiltered],
  )

  const upcomingCloses = useMemo(
    () =>
      visibleIssues
        .filter((i) => i.status === "open" || i.status === "voted")
        .slice()
        .sort(
          (a, b) =>
            new Date(a.closesAt).getTime() - new Date(b.closesAt).getTime(),
        )
        .slice(0, 3),
    [visibleIssues],
  )

  const votedCount = visibleIssues.filter((i) => i.status === "voted").length

  async function handleVote(id: number, optionId: number) {
    if (!me) {
      setVoteError("로그인 후 참여할 수 있어요")
      return
    }
    setVoteError(null)
    try {
      const result = await castVote(id, me.userId, optionId)
      const vote: LocalVote = {
        optionId: result.optionId,
        liveCounts: result.liveCounts.map((option) => ({
          id: option.id,
          voteCount: option.voteCount ?? 0,
        })),
      }
      saveLocalVote(me.userId, id, vote)
      setLocalVotes((prev) => ({ ...prev, [id]: vote }))
    } catch (e) {
      setVoteError(e instanceof ApiError ? e.message : "투표에 실패했습니다")
    }
  }

  const score = me?.credibilityScore ?? 0
  const progress = tierProgress(score)

  if (loading) {
    return (
      <div className="flex flex-col gap-[22px] px-6 pt-8 pb-11">
        <div className="text-label text-ink-subtle">불러오는 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-[22px] px-6 pt-8 pb-11">
        <div className="rounded-xl border border-dashed border-line-strong px-5 py-10 text-center text-label text-ink-subtle">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[22px] px-6 pt-8 pb-11">
      <div className="grid grid-cols-[200px_1fr_266px] gap-[30px]">
        <div className="flex flex-col gap-3">
          <div className="text-label tracking-[0.05em] text-ink-subtle">
            카테고리
          </div>
          <nav className="flex flex-col gap-1.5">
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
                      ? "flex items-center gap-[7px] rounded-xl bg-ink px-[15px] py-2.5 text-label leading-none text-bg"
                      : "flex items-center gap-[7px] rounded-xl border border-line bg-card px-[15px] py-2.5 text-label leading-none text-ink-muted transition-colors hover:text-ink"
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
                        ? "text-[color:color-mix(in_oklab,var(--bg)_50%,transparent)]"
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

        <div className="flex flex-col gap-[13px]">
          <div className="flex items-baseline gap-2.5">
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

          {voteError && (
            <div className="rounded-lg border border-wrong bg-wrong-chip px-4 py-2.5 text-caption text-[#D6DEEC]">
              {voteError}
            </div>
          )}

          <div className="flex flex-col gap-[13px]">
            {list.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                categoryName={categoryNameById[issue.categoryId] ?? ""}
                onVote={handleVote}
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
                    <span className="text-label">{issue.question}</span>
                    <span className="text-caption text-accent tabular-nums">
                      {formatRemaining(issue.closesAt, now)}
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
