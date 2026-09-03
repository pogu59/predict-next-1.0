"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import {
  ApiError,
  castVote,
  fetchCategories,
  fetchTopic,
  type Category,
  type Topic,
} from "@/lib/api"
import { fetchMe, type Me } from "@/lib/auth"
import { categoryMeta } from "@/lib/categoryMeta"
import {
  formatRemaining,
  isUrgent,
  loadLocalVotes,
  saveLocalVote,
  toUiIssue,
  useNow,
  type LocalVote,
} from "@/lib/issues"
import { tierIcon, tierLabel, tierProgress } from "@/lib/tier"
import { Icon } from "@/components/icon"

export default function IssueDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const topicId = Number(params.id)
  const now = useNow()

  const [topic, setTopic] = useState<Topic | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [me, setMe] = useState<Me | null>(null)
  const [localVote, setLocalVote] = useState<LocalVote | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [voteError, setVoteError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [topicResult, categoriesResult, meResult] = await Promise.all([
          fetchTopic(topicId),
          fetchCategories(),
          fetchMe(),
        ])
        if (cancelled) return
        setTopic(topicResult)
        setCategories(categoriesResult)
        setMe(meResult)
        if (meResult) setLocalVote(loadLocalVotes(meResult.userId)[topicId])
      } catch (e) {
        if (!cancelled)
          setError(
            e instanceof ApiError ? e.message : "이슈를 불러오지 못했습니다",
          )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [topicId])

  async function handleVote(optionId: number) {
    if (!me) {
      setVoteError("로그인 후 참여할 수 있어요")
      return
    }
    setVoteError(null)
    try {
      const result = await castVote(topicId, me.userId, optionId)
      const vote: LocalVote = {
        optionId: result.optionId,
        liveCounts: result.liveCounts.map((option) => ({
          id: option.id,
          voteCount: option.voteCount ?? 0,
        })),
      }
      saveLocalVote(me.userId, topicId, vote)
      setLocalVote(vote)
    } catch (e) {
      setVoteError(e instanceof ApiError ? e.message : "투표에 실패했습니다")
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-[22px] px-6 pt-8 pb-11">
        <div className="text-label text-ink-subtle">불러오는 중...</div>
      </div>
    )
  }

  if (error || !topic) {
    return (
      <div className="flex flex-col gap-[22px] px-6 pt-8 pb-11">
        <div className="rounded-xl border border-dashed border-line-strong px-5 py-10 text-center text-label text-ink-subtle">
          {error ?? "존재하지 않는 이슈입니다"}
        </div>
      </div>
    )
  }

  const issue = toUiIssue(topic, localVote)
  const categoryName =
    categories.find((c) => c.id === topic.categoryId)?.name ?? ""
  const cat = categoryMeta(categoryName)
  const myOption = issue.options.find((o) => o.id === issue.myOptionId)
  const correctOption = issue.options.find(
    (o) => o.id === issue.settlement?.correctOptionId,
  )
  const minorityPct =
    issue.ratio && issue.myOptionId !== undefined
      ? issue.ratio[issue.myOptionId]
      : undefined
  const settled = issue.status === "settled"
  const result = issue.settlement?.result

  const score = me?.credibilityScore ?? 0
  const progress = tierProgress(score)

  return (
    <div className="flex flex-col gap-[22px] px-6 pt-8 pb-11">
      <div className="mx-auto flex w-full max-w-[1050px] gap-[30px]">
        <div className="flex w-full max-w-[760px] flex-col gap-[14px]">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => router.push("/issue")}
              className="flex items-center gap-1.5 text-label text-ink-subtle hover:text-ink"
            >
              <Icon name="arrow_back" filled={false} size={18} />
              오늘의 예측
            </button>
            <div className="flex-auto" />
            {issue.totalVotes !== undefined && (
              <span className="text-caption text-ink-subtle tabular-nums">
                {issue.totalVotes.toLocaleString()}명 참여
              </span>
            )}
            {(issue.status === "open" || issue.status === "voted") && (
              <span
                className={`rounded-md px-2.5 py-1.5 text-caption font-extrabold tabular-nums ${
                  isUrgent(issue.closesAt, now)
                    ? "bg-[color:color-mix(in_oklab,var(--accent)_14%,transparent)] text-accent"
                    : "bg-control text-ink-subtle"
                }`}
              >
                {formatRemaining(issue.closesAt, now)}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-[18px] rounded-2xl border border-line bg-card p-6">
            <div className="flex items-center gap-2">
              <Icon name={cat.icon} size={16} style={{ color: cat.color }} />
              <span className="text-label" style={{ color: cat.color }}>
                {categoryName}
              </span>
            </div>

            <h1 className="text-h1 text-pretty">{issue.question}</h1>

            {voteError && (
              <div className="rounded-lg border border-wrong bg-wrong-chip px-4 py-2.5 text-caption text-[#D6DEEC]">
                {voteError}
              </div>
            )}

            {issue.status === "open" ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex flex-col gap-3">
                  {issue.options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleVote(option.id)}
                      className="rounded-xl border border-line bg-control py-5 text-h2 text-ink transition-colors hover:border-accent hover:text-accent"
                    >
                      {option.text}
                    </button>
                  ))}
                </div>
                <span className="text-caption text-ink-faint">
                  투표하면 실시간 비율이 공개됩니다
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {issue.options.map((option) => {
                  const pct = issue.ratio?.[option.id] ?? 0
                  const isMine = option.id === issue.myOptionId
                  const isCorrect =
                    settled && option.id === issue.settlement?.correctOptionId
                  const barColor = isCorrect
                    ? "bg-accent"
                    : isMine
                      ? "bg-accent"
                      : "bg-track"
                  return (
                    <div
                      key={option.id}
                      className={`flex flex-col gap-2.5 rounded-xl border p-4 ${
                        isCorrect || isMine
                          ? "border-accent"
                          : "border-line-strong"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-h3">{option.text}</span>
                        {isMine && (
                          <span className="rounded-md bg-accent px-1.5 py-1 text-caption leading-none text-accent-ink">
                            내 선택
                          </span>
                        )}
                        {isCorrect && (
                          <span className="rounded-md bg-accent px-1.5 py-1 text-caption leading-none text-accent-ink">
                            정답
                          </span>
                        )}
                        <div className="flex-auto" />
                        <span className="text-h3 tabular-nums">{pct}%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-track">
                        <div
                          className={`h-full rounded-full ${barColor}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}

                {issue.status === "voted" &&
                  minorityPct !== undefined &&
                  minorityPct < 50 && (
                    <span className="text-caption text-accent tabular-nums">
                      {minorityPct}%만 이쪽 · 소수 의견입니다
                    </span>
                  )}

                {issue.status === "pending" && (
                  <span className="text-caption text-ink-subtle">
                    {myOption
                      ? `결과 판정 예정 · 내 선택 ${myOption.text}`
                      : "결과 판정 예정"}
                  </span>
                )}

                {settled && (
                  <span
                    className={`text-label ${
                      result === "correct"
                        ? "text-accent"
                        : result === "wrong"
                          ? "text-wrong"
                          : "text-void"
                    }`}
                  >
                    {result === "correct"
                      ? "맞혔어요"
                      : result === "wrong"
                        ? "아쉽게 틀렸어요"
                        : "결과가 확정됐어요"}
                    {correctOption && ` · 정답 ${correctOption.text}`}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <aside className="flex w-[290px] flex-none flex-col gap-[13px]">
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
        </aside>
      </div>
    </div>
  )
}
