"use client"

import { Flame, Heart, MessageCircle } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import type { Issue } from "@/lib/api"
import { DAY, useNow } from "@/lib/issues"
import { useMe } from "@/lib/queries/auth"
import { useIssues } from "@/lib/queries/issue"
import { usePosts } from "@/lib/queries/post"
import { useMyVotes } from "@/lib/queries/user"
import { TierIcon } from "@/lib/tier"
import { cn } from "@/lib/utils"
import { CreditCard } from "@/components/credit-card"
import { IssueCardMobile, IssueCardPc } from "@/components/issue-card"
import { Logo } from "@/components/ui/brand"

type Filter = "open" | "soon" | "result"

const FILTERS: { key: Filter; label: string }[] = [
  { key: "open", label: "진행 중" },
  { key: "soon", label: "마감 임박" },
  { key: "result", label: "결과" },
]

const byDeadline = (a: Issue, b: Issue) => Date.parse(a.voteDeadlineAt) - Date.parse(b.voteDeadlineAt)

export default function IssueHomePage() {
  const now = useNow()
  const [filter, setFilter] = useState<Filter>("open")
  const { data: me } = useMe()
  const { data: issues = [], isLoading, error } = useIssues(me?.userId)
  const { data: myVotes = [] } = useMyVotes(me?.userId)

  const deltaByIssue = useMemo(
    () => Object.fromEntries(myVotes.map((v) => [v.issueId, v.scoreDelta])),
    [myVotes],
  )

  const nowMs = now.getTime()
  const buckets: Record<Filter, Issue[]> = {
    open: issues.filter((i) => i.status === "OPEN"),
    soon: issues.filter((i) => i.status === "OPEN" && Date.parse(i.voteDeadlineAt) - nowMs < DAY),
    result: issues.filter((i) => i.status !== "OPEN"),
  }
  // 진행 중/임박은 마감 빠른 순, 결과는 최근 마감 순.
  const feed = [...buckets[filter]].sort((a, b) => (filter === "result" ? byDeadline(b, a) : byDeadline(a, b)))

  const chips = (size: "mobile" | "pc") =>
    FILTERS.map((f) => (
      <button
        key={f.key}
        type="button"
        onClick={() => setFilter(f.key)}
        className={cn(
          "flex rounded-full font-bold",
          size === "mobile" ? "gap-[5px] px-3.5 py-[9px] text-[13px]" : "gap-1.5 px-4 py-2.5 text-sm",
          filter === f.key ? "bg-ink text-white" : "bg-surface text-sub",
        )}
      >
        {f.label}
        <span className="tabular-nums opacity-55">{buckets[f.key].length}</span>
      </button>
    ))

  const empty = !isLoading && feed.length === 0
  const status = error ? error.message : isLoading ? "불러오는 중..." : "해당하는 이슈가 없어요"

  return (
    <>
      {/* 모바일 */}
      <div className="pb-[100px] lg:hidden">
        <div className="flex items-center justify-between px-5 pt-2 pb-3.5">
          <Logo />
          {me ? (
            <Link
              href="/my"
              className="flex items-center gap-1.5 rounded-full bg-surface py-1.5 pr-3 pl-[7px] shadow-[0_1px_2px_rgba(0,0,0,.05)]"
            >
              <TierIcon tier={me.tier} size={20} />
              <span className="text-sm font-bold tabular-nums">{me.credibilityScore.toLocaleString()}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-surface px-3 py-1.5 text-sm font-bold shadow-[0_1px_2px_rgba(0,0,0,.05)]"
            >
              로그인
            </Link>
          )}
        </div>
        <div className="flex gap-1.5 px-5 pb-3.5">{chips("mobile")}</div>
        <div className="flex flex-col gap-2.5 px-4">
          {feed.map((issue) => (
            <IssueCardMobile key={issue.id} issue={issue} now={now} scoreDelta={deltaByIssue[issue.id]} />
          ))}
          {(empty || isLoading || error) && (
            <div className="py-[60px] text-center text-sm text-faint">{status}</div>
          )}
        </div>
      </div>

      {/* PC */}
      <div className="hidden grid-cols-[minmax(0,1fr)_320px] items-start gap-7 lg:grid">
        <div className="flex flex-col gap-[18px]">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-[30px] font-extrabold tracking-[-0.04em]">예측</h1>
            <span className="flex-1" />
            <div className="flex gap-1.5">{chips("pc")}</div>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {feed.map((issue) => (
              <IssueCardPc key={issue.id} issue={issue} now={now} scoreDelta={deltaByIssue[issue.id]} />
            ))}
          </div>
          {(empty || isLoading || error) && (
            <div className="py-20 text-center text-[15px] text-faint">{status}</div>
          )}
        </div>
        <aside className="sticky top-[92px] flex flex-col gap-3.5">
          <CreditCard header="profile" className="rounded-3xl p-[22px]" />
          <HotPosts />
        </aside>
      </div>
    </>
  )
}

function HotPosts() {
  const { data } = usePosts({ sort: "hot", size: 20 })
  const posts = (data?.items ?? []).slice(0, 3)
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
