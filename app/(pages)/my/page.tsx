"use client"

import { useEffect, useMemo, useState } from "react"

import {
  ApiError,
  fetchMyStats,
  fetchMyVotes,
  type MyStats,
  type MyVote,
} from "@/lib/api"
import { fetchMe, type Me } from "@/lib/auth"
import { tierLabel, tierProgress } from "@/lib/tier"
import { StatTile } from "@/components/my/statTile"
import { VoteHistoryRow } from "@/components/my/voteHistoryRow"

type FilterTab = "all" | "correct" | "incorrect" | "pending"

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "correct", label: "적중" },
  { value: "incorrect", label: "실패" },
  { value: "pending", label: "진행 중" },
]

function matchesFilter(vote: MyVote, filter: FilterTab) {
  if (filter === "all") return true
  if (filter === "pending") return vote.result === null
  if (filter === "correct") return vote.result === "CORRECT"
  return vote.result === "INCORRECT"
}

function startOfWeek(now = new Date()) {
  const d = new Date(now)
  const day = (d.getDay() + 6) % 7 // 월요일 시작
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - day)
  return d
}

export default function MyPage() {
  const [me, setMe] = useState<Me | null | undefined>(undefined)
  const [stats, setStats] = useState<MyStats | null>(null)
  const [votes, setVotes] = useState<MyVote[]>([])
  const [filter, setFilter] = useState<FilterTab>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const meResult = await fetchMe()
        if (cancelled) return
        setMe(meResult)
        if (!meResult) return

        const [statsResult, votesResult] = await Promise.all([
          fetchMyStats(meResult.userId),
          fetchMyVotes(meResult.userId),
        ])
        if (cancelled) return
        setStats(statsResult)
        setVotes(votesResult)
      } catch (e) {
        if (!cancelled)
          setError(
            e instanceof ApiError
              ? e.message
              : "마이페이지를 불러오지 못했습니다",
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

  const weeklyCount = useMemo(() => {
    const weekStart = startOfWeek()
    return votes.filter((v) => new Date(v.votedAt) >= weekStart).length
  }, [votes])

  const filteredVotes = useMemo(
    () => votes.filter((v) => matchesFilter(v, filter)),
    [votes, filter],
  )

  if (loading) {
    return (
      <div className="flex flex-col gap-3 px-6 pt-8 pb-11">
        <div className="text-label text-ink-subtle">불러오는 중...</div>
      </div>
    )
  }

  if (!me) {
    return (
      <div className="flex flex-col gap-3 px-6 pt-8 pb-11">
        <div className="rounded-xl border border-dashed border-line-strong px-5 py-10 text-center text-label text-ink-subtle">
          로그인 후 이용할 수 있어요
          <a href="/login" className="ml-2 text-accent">
            로그인하러 가기
          </a>
        </div>
      </div>
    )
  }

  const score = me.credibilityScore
  const progress = tierProgress(score)
  const accuracy =
    stats && stats.gradedCount > 0
      ? Math.round((stats.correctCount / stats.gradedCount) * 100)
      : null

  return (
    <div className="flex flex-col items-center gap-[22px] px-4 pt-8 pb-11 sm:px-6">
      <div className="flex w-full max-w-[760px] flex-col gap-[22px]">
        {error && (
          <div className="rounded-lg border border-wrong bg-wrong-chip px-4 py-2.5 text-caption text-[#D6DEEC]">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-[14px]">
          <div className="flex flex-col items-center gap-[22px] rounded-2xl border border-line bg-card p-[22px] sm:flex-row">
            <div className="flex h-[76px] w-[76px] flex-none items-center justify-center rounded-[22px] bg-control">
              <span className="text-3xl text-ink-faint">👤</span>
            </div>
            <div className="flex flex-1 flex-col items-center gap-2 sm:items-start">
              <div className="flex items-center gap-2">
                <h1 className="text-h1">{me.nickname}</h1>
                <span className="rounded-md bg-void px-[7px] py-[5px] text-caption leading-none text-accent-ink">
                  {tierLabel(me.tier)}
                </span>
              </div>
            </div>
            <div
              className="flex w-full flex-col gap-2.5 rounded-2xl p-4 sm:w-[250px] sm:flex-none"
              style={{
                background:
                  "linear-gradient(105deg, var(--accent), var(--accent-deep))",
              }}
            >
              <span className="text-caption text-[color:color-mix(in_oklab,var(--accent-ink)_62%,transparent)]">
                내 신용도
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
          </div>

          <div className="flex gap-2.5">
            <StatTile
              label="총 참여"
              value={stats?.totalVotes ?? 0}
              sub={`이번 주 ${weeklyCount}`}
            />
            <StatTile
              label="전체 적중률"
              value={accuracy !== null ? `${accuracy}%` : "-"}
              valueClassName="text-accent"
              sub={
                stats
                  ? `${stats.correctCount}승 ${stats.gradedCount - stats.correctCount}패`
                  : undefined
              }
            />
          </div>

          <div className="flex flex-col gap-3.5 rounded-2xl border border-line bg-card p-5">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-2">
              <h3 className="text-h3">최근 투표 기록</h3>
              <span className="text-caption text-ink-subtle tabular-nums">
                {votes.length}개
              </span>
              <div className="flex-auto" />
              <div className="flex gap-1 rounded-[11px] bg-sunken p-1">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setFilter(tab.value)}
                    className={
                      filter === tab.value
                        ? "rounded-lg bg-ink px-2.5 py-1.5 text-label text-bg"
                        : "rounded-lg px-2.5 py-1.5 text-label text-ink-subtle hover:text-ink"
                    }
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col">
              {filteredVotes.length === 0 ? (
                <div className="py-8 text-center text-label text-ink-subtle">
                  기록이 없어요
                </div>
              ) : (
                filteredVotes.map((vote) => (
                  <VoteHistoryRow key={vote.voteId} vote={vote} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
