"use client"

import { Flame, Heart, MessageCircle } from "lucide-react"
import Link from "next/link"
import { useMemo } from "react"

import type { Issue } from "@/lib/api"
import { DAY, useNow } from "@/lib/issues"
import { useMe } from "@/lib/queries/auth"
import { useIssues } from "@/lib/queries/issue"
import { usePosts } from "@/lib/queries/post"
import { useMyVotes } from "@/lib/queries/user"
import { cn } from "@/lib/utils"
import { CreditCard } from "@/components/credit-card"
import { IssueCardPc } from "@/components/issue-card"

export type IssueFilter = "open" | "soon" | "result"

export const ISSUE_FILTERS: { key: IssueFilter; label: string }[] = [
  { key: "open", label: "진행 중" },
  { key: "soon", label: "마감 임박" },
  { key: "result", label: "결과" },
]

export function parseIssueFilter(value: string | null): IssueFilter {
  return ISSUE_FILTERS.some((f) => f.key === value) ? (value as IssueFilter) : "open"
}

const byDeadline = (a: Issue, b: Issue) => Date.parse(a.voteDeadlineAt) - Date.parse(b.voteDeadlineAt)

/** 진행 중/임박은 마감 빠른 순, 결과는 최근 마감 순. */
export function sortForFilter(issues: Issue[], filter: IssueFilter) {
  return [...issues].sort((a, b) => (filter === "result" ? byDeadline(b, a) : byDeadline(a, b)))
}

/**
 * 이슈 목록을 필터별로 나눈다 — 진행 중(OPEN) / 마감 임박(OPEN & 24h 미만) / 결과(PENDING_RESULT + CONFIRMED).
 * deltaByIssue는 확정 이슈의 "적중 +n" 칩에 쓰는 내 정산 점수.
 */
export function useIssueBuckets() {
  const now = useNow()
  const { data: me } = useMe()
  const { data: issues = [], isLoading, error } = useIssues(me?.userId)
  const { data: myVotes = [] } = useMyVotes(me?.userId)

  const deltaByIssue = useMemo(
    () => Object.fromEntries(myVotes.map((v) => [v.issueId, v.scoreDelta])) as Record<number, number | null>,
    [myVotes],
  )

  const nowMs = now.getTime()
  const buckets: Record<IssueFilter, Issue[]> = {
    open: issues.filter((i) => i.status === "OPEN"),
    soon: issues.filter((i) => i.status === "OPEN" && Date.parse(i.voteDeadlineAt) - nowMs < DAY),
    result: issues.filter((i) => i.status !== "OPEN"),
  }
  return { now, me, buckets, deltaByIssue, isLoading, error }
}

export function FilterChips({
  filter,
  onChange,
  counts,
  size,
}: {
  filter: IssueFilter
  onChange: (filter: IssueFilter) => void
  counts: Record<IssueFilter, number>
  size: "mobile" | "pc"
}) {
  return ISSUE_FILTERS.map((f) => (
    <button
      key={f.key}
      type="button"
      onClick={() => onChange(f.key)}
      className={cn(
        "flex rounded-full font-bold",
        size === "mobile" ? "gap-[5px] px-3.5 py-[9px] text-[13px]" : "gap-1.5 px-4 py-2.5 text-sm",
        filter === f.key ? "bg-ink text-white" : "bg-surface text-sub",
      )}
    >
      {f.label}
      <span className="tabular-nums opacity-55">{counts[f.key]}</span>
    </button>
  ))
}

/** PC 예측 화면 — "예측" 제목 + 필터 칩, 카드 그리드, 우측 320px 스티키 사이드(신용도 카드, 커뮤니티 인기글). */
export function IssuesPc({ filter, onFilter }: { filter: IssueFilter; onFilter: (filter: IssueFilter) => void }) {
  const { now, buckets, deltaByIssue, isLoading, error } = useIssueBuckets()
  const feed = sortForFilter(buckets[filter], filter)
  const counts = { open: buckets.open.length, soon: buckets.soon.length, result: buckets.result.length }
  const status = error ? error.message : isLoading ? "불러오는 중..." : "해당하는 이슈가 없어요"

  return (
    <div className="hidden grid-cols-[minmax(0,1fr)_320px] items-start gap-7 lg:grid">
      <div className="flex flex-col gap-[18px]">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-[30px] font-extrabold tracking-[-0.04em]">예측</h1>
          <span className="flex-1" />
          <div className="flex gap-1.5">
            <FilterChips filter={filter} onChange={onFilter} counts={counts} size="pc" />
          </div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
          {feed.map((issue) => (
            <IssueCardPc key={issue.id} issue={issue} now={now} scoreDelta={deltaByIssue[issue.id]} />
          ))}
        </div>
        {feed.length === 0 && <div className="py-20 text-center text-[15px] text-faint">{status}</div>}
      </div>
      <aside className="sticky top-[92px] flex flex-col gap-3.5">
        <CreditCard header="profile" className="rounded-3xl p-[22px]" />
        <HotPostsAside />
      </aside>
    </div>
  )
}

/** 커뮤니티 인기글 상위 3개 — PC 사이드와 모바일 홈 허브가 같은 쿼리를 쓴다. */
export function useHotPosts() {
  const query = usePosts({ sort: "hot", size: 20 })
  return { ...query, posts: (query.data?.items ?? []).slice(0, 3) }
}

function HotPostsAside() {
  const { posts } = useHotPosts()
  return (
    <div className="flex flex-col gap-1 rounded-3xl bg-surface p-5">
      <div className="flex items-center gap-2 pb-1.5">
        <Flame className="size-[18px] text-danger" />
        <span className="text-base font-extrabold">커뮤니티 인기글</span>
        <span className="flex-1" />
        <Link href="/board" className="text-[13px] text-muted">
          더보기
        </Link>
      </div>
      {posts.map((p, i) => (
        <Link key={p.id} href={`/board/${p.id}`} className="flex gap-2.5 border-t border-line-3 py-2.5">
          <span className="w-4 text-[15px] font-extrabold text-brand">{i + 1}</span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-sm leading-[1.4] font-semibold">{p.title}</span>
            <span className="flex gap-2 text-xs text-faint">
              <span className="flex items-center gap-0.5">
                <Heart className="size-3" />
                {p.likeCount}
              </span>
              <span className="flex items-center gap-0.5">
                <MessageCircle className="size-3" />
                {p.replyCount}
              </span>
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
