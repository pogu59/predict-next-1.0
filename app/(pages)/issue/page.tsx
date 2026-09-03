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
  issueStatus,
  loadLocalVotes,
  saveLocalVote,
  useNow,
  type LocalVote,
} from "@/lib/issues"
import { tierIcon, tierLabel, tierProgress } from "@/lib/tier"
import { Icon } from "@/components/icon"
import { IssueCard } from "@/components/issueCard"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

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
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [pendingVote, setPendingVote] = useState<{
    id: number
    optionId: number
    optionText: string
  } | null>(null)
  const [voting, setVoting] = useState(false)
  const [pendingVoteError, setPendingVoteError] = useState<string | null>(null)

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

  /** 진행 중인 이슈는 전부, 마감/확정 이슈는 본인이 참여한 것만 남긴다. */
  const visibleIssues = useMemo(
    () =>
      topics.filter((t) => {
        const status = issueStatus(t, localVotes[t.id])
        return (
          status === "open" || status === "voted" || localVotes[t.id] !== undefined
        )
      }),
    [topics, localVotes],
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
            const status = issueStatus(t, localVotes[t.id])
            return statusFilter === "open"
              ? status === "open" || status === "voted"
              : status === "pending" || status === "settled"
          }),
    [categoryFiltered, statusFilter, localVotes],
  )

  const statusCounts = useMemo(() => {
    let open = 0
    let settled = 0
    for (const t of categoryFiltered) {
      const status = issueStatus(t, localVotes[t.id])
      if (status === "open" || status === "voted") open++
      else settled++
    }
    return { all: categoryFiltered.length, open, settled }
  }, [categoryFiltered, localVotes])

  const upcomingCloses = useMemo(
    () =>
      visibleIssues
        .filter((t) => {
          const status = issueStatus(t, localVotes[t.id])
          return status === "open" || status === "voted"
        })
        .slice()
        .sort(
          (a, b) =>
            new Date(a.voteDeadlineAt).getTime() -
            new Date(b.voteDeadlineAt).getTime(),
        )
        .slice(0, 3),
    [visibleIssues, localVotes],
  )

  const votedCount = visibleIssues.filter(
    (t) => issueStatus(t, localVotes[t.id]) === "voted",
  ).length

  function handleVoteClick(id: number, optionId: number) {
    if (!me) {
      setShowLoginPrompt(true)
      return
    }
    const optionText =
      topics.find((t) => t.id === id)?.options.find((o) => o.id === optionId)
        ?.text ?? ""
    setPendingVoteError(null)
    setPendingVote({ id, optionId, optionText })
  }

  async function confirmVote() {
    if (!me || !pendingVote) return
    const { id, optionId } = pendingVote
    setVoting(true)
    setPendingVoteError(null)
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
      setPendingVote(null)
    } catch (e) {
      setPendingVoteError(
        e instanceof ApiError ? e.message : "투표에 실패했습니다",
      )
    } finally {
      setVoting(false)
    }
  }

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
          {error}
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
            {list.map((topic) => (
              <IssueCard
                key={topic.id}
                topic={topic}
                localVote={localVotes[topic.id]}
                categoryName={categoryNameById[topic.categoryId] ?? ""}
                onVote={handleVoteClick}
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
              {upcomingCloses.map((topic, i) => (
                <div key={topic.id} className="flex flex-col gap-3">
                  {i > 0 && <div className="h-px bg-line" />}
                  <div className="flex flex-col gap-1">
                    <span className="text-label">{topic.title}</span>
                    <span className="text-caption text-accent tabular-nums">
                      {formatRemaining(topic.voteDeadlineAt, now)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={pendingVote !== null}
        onOpenChange={(open) => !open && setPendingVote(null)}
        title="이 선택으로 투표할까요?"
        description={`"${pendingVote?.optionText}" · 투표 후에는 선택을 바꾸거나 취소할 수 없어요.`}
        confirmLabel="투표하기"
        loading={voting}
        error={pendingVoteError}
        onConfirm={confirmVote}
      />

      <ConfirmDialog
        open={showLoginPrompt}
        onOpenChange={setShowLoginPrompt}
        title="로그인이 필요해요"
        description="로그인하면 투표에 참여하고 신용도 점수를 쌓을 수 있어요."
        confirmLabel="로그인하러 가기"
        cancelLabel="닫기"
        onConfirm={() => router.push("/login")}
      />
    </div>
  )
}
