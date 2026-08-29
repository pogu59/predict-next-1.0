"use client"

import { useEffect, useMemo, useState } from "react"

import { ApiError, castVote, fetchCategories, fetchTopics, type CategoryDto, type TopicDto } from "@/lib/api"
import { fetchMe, type Me } from "@/lib/auth"
import { ALL_CATEGORY_META, categoryMeta } from "@/lib/category-meta"
import {
  loadLocalVotes,
  saveLocalVote,
  toBackendChoice,
  toLocalChoice,
  toUiIssue,
  type LocalVote,
} from "@/lib/issues"
import { tierLabel, tierProgress } from "@/lib/tier"
import { Icon } from "@/components/icon"
import { IssueCard } from "@/components/issue-card"

export default function IssuePage() {
  const [category, setCategory] = useState<number | "all">("all")
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [topics, setTopics] = useState<TopicDto[]>([])
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
        if (!cancelled) setError(e instanceof Error ? e.message : "이슈를 불러오지 못했습니다")
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

  const list = useMemo(
    () => (category === "all" ? issues : issues.filter((i) => i.categoryId === category)),
    [category, issues],
  )

  const votedCount = issues.filter((i) => i.status === "voted").length

  async function handleVote(id: number, choice: "yes" | "no") {
    if (!me) {
      setVoteError("로그인 후 참여할 수 있어요")
      return
    }
    setVoteError(null)
    try {
      const result = await castVote(id, me.userId, toBackendChoice(choice))
      const vote: LocalVote = {
        choice: toLocalChoice(result.choice),
        liveYesCount: result.liveYesCount,
        liveNoCount: result.liveNoCount,
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
        <div className="text-ink-subtle text-sm font-bold">불러오는 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-[22px] px-6 pt-8 pb-11">
        <div className="border-line-strong text-ink-subtle rounded-xl border border-dashed px-5 py-10 text-center text-sm font-bold">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[22px] px-6 pt-8 pb-11">
      <section className="flex flex-col gap-3">
        <div className="text-ink-subtle text-xs font-bold tracking-[0.05em]">
          카테고리
        </div>
        <div className="flex items-center gap-2">
          {[{ id: "all" as const, name: "전체" }, ...categories].map((c) => {
            const active = c.id === category
            const meta = c.id === "all" ? ALL_CATEGORY_META : categoryMeta(c.name)
            const count =
              c.id === "all" ? issues.length : issues.filter((i) => i.categoryId === c.id).length
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={
                  active
                    ? "bg-ink inline-flex items-center gap-[7px] rounded-full px-[17px] py-2.5 text-sm leading-none font-extrabold tracking-[-0.02em] text-bg"
                    : "border-line text-ink-muted hover:text-ink inline-flex items-center gap-[7px] rounded-full border bg-card px-[17px] py-2.5 text-sm leading-none font-bold tracking-[-0.02em] transition-colors"
                }
              >
                <Icon
                  name={meta.icon}
                  size={17}
                  style={{ color: active ? "var(--bg)" : meta.color }}
                />
                {c.name}
                <span
                  className={`text-[11.5px] font-bold tabular-nums ${
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
        </div>
      </section>

      <div className="grid grid-cols-[1fr_266px] gap-[30px]">
        <section className="flex flex-col gap-[13px]">
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-2xl font-extrabold tracking-[-0.04em]">
              진행 중인 이슈
            </h2>
            <span className="text-ink-subtle text-[12.5px] font-bold tabular-nums">
              {list.length}건 · 참여 완료 {votedCount}건
            </span>
          </div>

          {voteError && (
            <div className="rounded-lg border border-wrong bg-wrong-chip px-4 py-2.5 text-[13px] font-bold text-[#D6DEEC]">
              {voteError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-[13px]">
            {list.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                categoryName={categoryNameById[issue.categoryId] ?? ""}
                onVote={handleVote}
              />
            ))}
          </div>

          {list.length === 0 && (
            <div className="border-line-strong text-ink-subtle rounded-xl border border-dashed px-5 py-10 text-center text-sm font-bold">
              이 카테고리에 진행 중인 이슈가 없어요
            </div>
          )}
        </section>

        <aside className="flex flex-col gap-[13px]">
          {me ? (
            <div
              className="flex flex-col gap-3 rounded-2xl p-[17px]"
              style={{
                background:
                  "linear-gradient(105deg, var(--accent), var(--accent-deep))",
              }}
            >
              <span className="text-[11.5px] font-bold text-[color:color-mix(in_oklab,var(--accent-ink)_62%,transparent)]">
                내 신용도 · {tierLabel(me.tier)}
              </span>
              <span className="text-accent-ink text-4xl leading-none font-extrabold tracking-[-0.045em] tabular-nums">
                {score.toLocaleString()}
              </span>
              <div className="h-[5px] overflow-hidden rounded-full bg-[color:color-mix(in_oklab,var(--accent-ink)_22%,transparent)]">
                <div
                  className="bg-accent-ink h-full"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              {progress.nextTier && (
                <span className="text-[11.5px] font-bold text-[color:color-mix(in_oklab,var(--accent-ink)_65%,transparent)] tabular-nums">
                  {tierLabel(progress.nextTier)}까지 {progress.nextAt! - score}점
                </span>
              )}
            </div>
          ) : (
            <div className="border-line-strong flex flex-col gap-2 rounded-2xl border border-dashed p-[17px]">
              <span className="text-[13px] font-bold">로그인하고 참여해보세요</span>
              <a
                href="/login"
                className="text-[12.5px] font-bold text-accent"
              >
                로그인하러 가기
              </a>
            </div>
          )}

          <div className="border-line-strong flex flex-col gap-[7px] rounded-2xl border border-dashed p-4">
            <span className="text-[12.5px] font-bold">돈은 걸지 않습니다</span>
            <span className="text-ink-subtle text-[11.5px] leading-[1.6] font-medium text-pretty">
              현금·코인·아이템 없이 신용도 점수와 티어만 오갑니다. 점수는 0점
              아래로 내려가지 않습니다.
            </span>
          </div>
        </aside>
      </div>
    </div>
  )
}
