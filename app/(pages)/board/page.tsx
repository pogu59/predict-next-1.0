"use client"

import { Heart, MessageCircle, PenLine, Search, TrendingUp, X } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"

import type { PostListItem, PostSort } from "@/lib/api"
import { leadingOption, optionPercents, timeAgo, useNow } from "@/lib/issues"
import { useMe } from "@/lib/queries/auth"
import { useIssues } from "@/lib/queries/issue"
import { usePosts } from "@/lib/queries/post"
import { cn } from "@/lib/utils"
import { CrewBadge } from "@/components/ui/brand"
import { ImageBox } from "@/components/ui/image-box"

const SORTS: { key: PostSort; label: string }[] = [
  { key: "hot", label: "인기" },
  { key: "new", label: "최신" },
]

function matches(post: PostListItem, q: string) {
  if (!q) return true
  return `${post.title}${post.contentPreview ?? ""}${post.authorNickname}`.toLowerCase().includes(q)
}

function BoardList() {
  const now = useNow(60_000)
  const searchParams = useSearchParams()
  const mineOnly = searchParams.get("author") === "me"
  const [sort, setSort] = useState<PostSort>(mineOnly ? "new" : "hot")
  const [searchOpen, setSearchOpen] = useState(mineOnly)
  const [query, setQuery] = useState("")

  const { data, isLoading, error } = usePosts({ sort, size: 50, ...(mineOnly ? { author: "me" } : {}) })
  const q = query.trim().toLowerCase()
  const posts = (data?.items ?? [])
    .filter((p) => matches(p, q))

  const emptyText = error ? error.message : isLoading ? "불러오는 중..." : "검색 결과가 없어요"
  const showEmpty = posts.length === 0

  const tabs = (pc: boolean) =>
    SORTS.map((t) => (
      <button
        key={t.key}
        type="button"
        onClick={() => setSort(t.key)}
        className={cn(
          "-mb-px border-b-2 text-[15px]",
          pc ? "pt-4 pb-3.5" : "py-2.5",
          sort === t.key ? "border-ink font-bold text-ink" : "border-transparent font-semibold text-faint",
        )}
      >
        {t.label}
      </button>
    ))

  return (
    <>
      {/* 모바일 */}
      <div className="pb-[110px] lg:hidden">
        <div className="flex items-center justify-between px-5 pt-2 pb-2.5">
          <h1 className="text-2xl font-extrabold tracking-[-0.04em]">커뮤니티</h1>
          <button
            type="button"
            onClick={() => {
              setSearchOpen((o) => !o)
              setQuery("")
            }}
            className="p-1"
            aria-label="검색"
          >
            {searchOpen ? <X className="size-6" /> : <Search className="size-6" />}
          </button>
        </div>
        {searchOpen && (
          <div className="mx-4 mb-2.5 flex h-[46px] items-center gap-2 rounded-[14px] bg-surface px-3.5 shadow-card">
            <Search className="size-5 text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="제목, 내용, 닉네임 검색"
              className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
            />
          </div>
        )}
        <div className="flex gap-5 border-b border-line-2 px-5">{tabs(false)}</div>
        <div className="flex flex-col">
          {posts.map((p) => (
            <PostRow key={p.id} post={p} now={now} />
          ))}
          {showEmpty && <div className="py-[60px] text-center text-sm text-faint">{emptyText}</div>}
        </div>
        <Link
          href="/board/write"
          className="fixed right-[18px] bottom-[100px] z-30 flex h-[52px] items-center gap-1.5 rounded-full bg-brand px-5 text-[15px] font-bold text-white shadow-fab"
        >
          <PenLine className="size-5" />
          글쓰기
        </Link>
      </div>

      {/* PC */}
      <div className="hidden grid-cols-[minmax(0,1fr)_320px] items-start gap-7 lg:grid">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-[30px] font-extrabold tracking-[-0.04em]">커뮤니티</h1>
            <span className="flex-1" />
            <div className="flex h-11 w-[300px] max-w-full items-center gap-2 rounded-[14px] bg-surface px-3.5 shadow-[0_0_0_1px_#EDEDEB]">
              <Search className="size-[18px] text-faint" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="제목, 내용, 닉네임 검색"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl bg-surface">
            <div className="flex gap-[22px] border-b border-line px-6">{tabs(true)}</div>
            {posts.map((p) => (
              <PostRow key={p.id} post={p} now={now} pc />
            ))}
            {showEmpty && <div className="py-[60px] text-center text-sm text-faint">{emptyText}</div>}
          </div>
        </div>
        <aside className="sticky top-[92px] flex flex-col gap-3.5">
          <Link
            href="/board/write"
            className="flex h-14 items-center justify-center gap-2 rounded-[18px] bg-brand text-base font-bold text-white shadow-fab-pc hover:bg-brand-hover"
          >
            <PenLine className="size-[19px]" />
            글쓰기
          </Link>
          <TrendingIssues />
        </aside>
      </div>
    </>
  )
}

function PostRow({ post, now, pc = false }: { post: PostListItem; now: Date; pc?: boolean }) {
  return (
    <Link
      href={`/board/${post.id}`}
      className={cn(
        "flex",
        pc
          ? "gap-[18px] border-b border-line-3 px-6 py-[18px] hover:bg-[#FAFAF9]"
          : "gap-3.5 border-b border-line px-5 py-4 hover:bg-[#F1F1EF]",
      )}
    >
      <div className={cn("flex min-w-0 flex-1 flex-col", pc ? "gap-[7px]" : "gap-1.5")}>
        <span className={cn("leading-[1.4] font-bold", pc ? "text-base" : "text-[15px]")}>{post.title}</span>
        {post.contentPreview && (
          <span className={cn("truncate leading-[1.5] text-sub", pc ? "text-sm" : "text-[13px]")}>
            {post.contentPreview}
          </span>
        )}
        <div className={cn("flex items-center text-xs text-faint", pc ? "gap-3" : "gap-2.5")}>
          <span className="flex min-w-0 items-center gap-1">
            {post.authorNickname}
            <CrewBadge name={post.authorCrewName} />· {timeAgo(post.createdAt, now)}
          </span>
          <span className={cn("flex items-center", pc ? "gap-[3px]" : "gap-0.5", post.likedByMe && "text-danger")}>
            <Heart className={pc ? "size-[13px]" : "size-3.5"} />
            {post.likeCount}
          </span>
          <span className={cn("flex items-center", pc ? "gap-[3px]" : "gap-0.5")}>
            <MessageCircle className={pc ? "size-[13px]" : "size-3.5"} />
            {post.replyCount}
          </span>
        </div>
      </div>
      {post.thumbnailUrl && (
        <ImageBox
          src={post.thumbnailUrl}
          className={pc ? "size-[88px] flex-none rounded-[14px]" : "size-[66px] flex-none rounded-xl"}
        />
      )}
    </Link>
  )
}

/** 진행 중 이슈 4개 + 선두 선택지 비율 */
function TrendingIssues() {
  const { data: me } = useMe()
  const { data: issues = [] } = useIssues(me?.userId)
  const trending = issues.filter((i) => i.status === "OPEN").slice(0, 4)
  return (
    <div className="flex flex-col gap-1 rounded-3xl bg-surface p-5">
      <div className="flex items-center gap-2 pb-1.5">
        <TrendingUp className="size-[18px] text-brand" />
        <span className="text-base font-extrabold">지금 뜨는 예측</span>
      </div>
      {trending.map((issue) => {
        const lead = leadingOption(issue.options)
        const pct = optionPercents(issue.options)
        return (
          <Link key={issue.id} href={`/issue/${issue.id}`} className="flex items-center gap-3 border-t border-line-3 py-2.5">
            <ImageBox src={issue.coverImageUrl} className="size-[46px] flex-none rounded-xl" iconSize={18} />
            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span className="truncate text-sm font-semibold">{issue.title}</span>
              {lead && (
                <span className="text-xs font-semibold text-brand">
                  {lead.text} {pct[lead.id]}%
                </span>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export default function BoardPage() {
  return (
    <Suspense>
      <BoardList />
    </Suspense>
  )
}
