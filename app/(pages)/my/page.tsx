"use client"

import { useEffect, useMemo, useState } from "react"

import { ApiError, fetchMyStats, fetchMyVotes, type MyStatsDto, type MyVoteDto } from "@/lib/api"
import { fetchMe, type Me } from "@/lib/auth"
import { tierLabel, tierProgress } from "@/lib/tier"
import { StatTile } from "@/components/my/stat-tile"
import { VoteHistoryRow } from "@/components/my/vote-history-row"

type FilterTab = "all" | "correct" | "incorrect" | "pending"

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "correct", label: "적중" },
  { value: "incorrect", label: "실패" },
  { value: "pending", label: "진행 중" },
]

function matchesFilter(vote: MyVoteDto, filter: FilterTab) {
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
  const [stats, setStats] = useState<MyStatsDto | null>(null)
  const [votes, setVotes] = useState<MyVoteDto[]>([])
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
        if (!cancelled) setError(e instanceof ApiError ? e.message : "마이페이지를 불러오지 못했습니다")
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

  const filteredVotes = useMemo(() => votes.filter((v) => matchesFilter(v, filter)), [votes, filter])

  if (loading) {
    return (
      <div className="flex flex-col gap-3 px-6 pt-8 pb-11">
        <div className="text-ink-subtle text-sm font-bold">불러오는 중...</div>
      </div>
    )
  }

  if (!me) {
    return (
      <div className="flex flex-col gap-3 px-6 pt-8 pb-11">
        <div className="border-line-strong text-ink-subtle rounded-xl border border-dashed px-5 py-10 text-center text-sm font-bold">
          로그인 후 이용할 수 있어요
          <a href="/login" className="text-accent ml-2 font-bold">
            로그인하러 가기
          </a>
        </div>
      </div>
    )
  }

  const score = me.credibilityScore
  const progress = tierProgress(score)
  const accuracy = stats && stats.gradedCount > 0 ? Math.round((stats.correctCount / stats.gradedCount) * 100) : null

  return (
    <div className="flex flex-col gap-[22px] px-6 pt-8 pb-11">
      {error && (
        <div className="border-wrong bg-wrong-chip rounded-lg border px-4 py-2.5 text-[13px] font-bold text-[#D6DEEC]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-[1fr_290px] gap-[30px]">
        <div className="flex flex-col gap-[14px]">
          <div className="border-line bg-card flex items-center gap-[22px] rounded-2xl border p-[22px]">
            <div className="bg-control flex h-[76px] w-[76px] flex-none items-center justify-center rounded-[22px]">
              <span className="text-ink-faint text-3xl">👤</span>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold tracking-[-0.04em]">{me.nickname}</span>
                <span className="bg-void text-accent-ink rounded-md px-[7px] py-[5px] text-[10.5px] font-extrabold leading-none">
                  {tierLabel(me.tier)}
                </span>
              </div>
            </div>
            <div
              className="flex w-[250px] flex-none flex-col gap-2.5 rounded-2xl p-4"
              style={{ background: "linear-gradient(105deg, var(--accent), var(--accent-deep))" }}
            >
              <span className="text-[11px] font-bold text-[color:color-mix(in_oklab,var(--accent-ink)_62%,transparent)]">
                내 신용도
              </span>
              <span className="text-accent-ink text-[32px] leading-none font-extrabold tracking-[-0.045em] tabular-nums">
                {score.toLocaleString()}
              </span>
              <div className="h-[5px] overflow-hidden rounded-full bg-[color:color-mix(in_oklab,var(--accent-ink)_22%,transparent)]">
                <div className="bg-accent-ink h-full" style={{ width: `${progress.percent}%` }} />
              </div>
              {progress.nextTier && (
                <span className="text-[11px] font-bold text-[color:color-mix(in_oklab,var(--accent-ink)_65%,transparent)] tabular-nums">
                  {tierLabel(progress.nextTier)}까지 {progress.nextAt! - score}점
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2.5">
            <StatTile label="총 참여" value={stats?.totalVotes ?? 0} sub={`이번 주 ${weeklyCount}`} />
            <StatTile
              label="전체 적중률"
              value={accuracy !== null ? `${accuracy}%` : "-"}
              valueClassName="text-accent"
              sub={stats ? `${stats.correctCount}승 ${stats.gradedCount - stats.correctCount}패` : undefined}
            />
          </div>

          <div className="border-line bg-card flex flex-col gap-3.5 rounded-2xl border p-5">
            <div className="flex items-baseline gap-2.5">
              <span className="text-base font-extrabold tracking-[-0.03em]">최근 투표 기록</span>
              <span className="text-ink-subtle text-xs font-bold tabular-nums">{votes.length}개</span>
              <div className="flex-auto" />
              <div className="bg-sunken flex gap-1 rounded-[11px] p-1">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setFilter(tab.value)}
                    className={
                      filter === tab.value
                        ? "bg-ink text-bg rounded-lg px-2.5 py-1.5 text-xs font-bold"
                        : "text-ink-subtle hover:text-ink rounded-lg px-2.5 py-1.5 text-xs font-bold"
                    }
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col">
              {filteredVotes.length === 0 ? (
                <div className="text-ink-subtle py-8 text-center text-sm font-bold">기록이 없어요</div>
              ) : (
                filteredVotes.map((vote) => <VoteHistoryRow key={vote.voteId} vote={vote} />)
              )}
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-[13px]">
          <div className="border-line-strong flex flex-col gap-[7px] rounded-2xl border border-dashed p-4">
            <span className="text-[12.5px] font-bold">돈은 걸지 않습니다</span>
            <span className="text-ink-subtle text-[11.5px] leading-[1.6] font-medium text-pretty">
              신용도 점수와 티어는 순위·뱃지 표시용이며 현금화할 수 없습니다.
            </span>
          </div>
        </aside>
      </div>
    </div>
  )
}
