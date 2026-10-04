"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"

import {
  Clock,
  Heart,
  ImageIcon,
  MessageCircle,
  PenLine,
  RotateCcw,
  Search,
  SlidersHorizontal,
  TrendingUp,
  X,
} from "lucide-react"

import type {
  PostListItem,
  PostSearchScope,
  PostSort,
  PostTopic,
} from "@/lib/api"
import {
  leadingOption,
  optionPercents,
  timeAgo,
  useDebounced,
  useNow,
} from "@/lib/issues"
import {
  parseTopic,
  POST_PERIODS as PERIODS,
  POST_TOPICS,
} from "@/lib/post-topics"
import { useMe } from "@/lib/queries/auth"
import { useIssues } from "@/lib/queries/issue"
import { usePosts } from "@/lib/queries/post"
import { cn } from "@/lib/utils"
import { BoardFilterSheet } from "@/components/board-filter-sheet"
import { TopicBadge } from "@/components/ui/brand"
import { ImageBox } from "@/components/ui/image-box"

const PAGE_SIZE = 20
const RECENT_KEY = "board_recent_searches"
const RECENT_MAX = 8

const SORTS: { key: PostSort; label: string }[] = [
  { key: "hot", label: "인기" },
  { key: "new", label: "최신" },
  { key: "comments", label: "댓글" },
  { key: "views", label: "조회" },
]

const SCOPES: { key: PostSearchScope; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "title", label: "제목" },
  { key: "author", label: "작성자" },
]

const pick = <T extends string>(
  list: { key: T }[],
  value: string | null,
  fallback: T,
) => (list.some((x) => x.key === value) ? (value as T) : fallback)

function readRecent(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]")
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : []
  } catch {
    return []
  }
}

function writeRecent(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list))
  } catch {
    // 저장이 막혀도 검색은 된다.
  }
}

/** 검색어 단어를 brand 배경으로 강조한다. */
function Highlight({ text, words }: { text: string; words: string[] }) {
  if (words.length === 0) return <>{text}</>
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  const parts = text.split(new RegExp(`(${escaped.join("|")})`, "gi"))
  return (
    <>
      {parts.map((part, i) =>
        words.some((w) => w.toLowerCase() === part.toLowerCase()) ? (
          <mark
            key={i}
            className="rounded-[3px] bg-brand-soft px-px text-brand"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  )
}

function BoardList() {
  const now = useNow(60_000)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // 필터 상태는 주소(?q=&scope=&topic=&sort=&period=&img=1)에 둬서 뒤로 가기·공유에도 유지된다.
  const mineOnly = searchParams.get("author") === "me"
  const keyword = searchParams.get("q") ?? ""
  const scope = pick(SCOPES, searchParams.get("scope"), "all")
  const topic = parseTopic(searchParams.get("topic"))
  const sort = pick(SORTS, searchParams.get("sort"), mineOnly ? "new" : "hot")
  const period = pick(PERIODS, searchParams.get("period"), "all")
  const hasImage = searchParams.get("img") === "1"

  const [draft, setDraft] = useState(keyword)
  const [searchOpen, setSearchOpen] = useState(mineOnly || keyword !== "")
  const [filterOpen, setFilterOpen] = useState(false)
  const [recent, setRecent] = useState<string[]>([])
  // "더 보기"로 늘린 페이지 수 — 필터가 바뀌면(주소가 바뀌면) 1페이지부터 다시.
  const filterKey = searchParams.toString()
  const [pager, setPager] = useState({ key: filterKey, n: 1 })
  const pages = pager.key === filterKey ? pager.n : 1
  const debounced = useDebounced(draft.trim(), 300)

  // 최근 검색어는 브라우저 저장소 값이라 서버 렌더와 어긋나지 않게 마운트 후에 읽는다.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecent(readRecent())
  }, [])

  function update(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(next)) {
      if (value == null || value === "") params.delete(key)
      else params.set(key, value)
    }
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  // 입력이 300ms 멈추면 주소의 검색어를 바꾼다.
  useEffect(() => {
    if (debounced !== keyword) update({ q: debounced || null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  /** Enter나 입력창을 벗어날 때 검색어를 최근 검색에 남긴다(입력 중인 반쪽 단어는 남기지 않는다). */
  function saveRecent() {
    const word = draft.trim()
    if (word.length < 2) return
    const next = [word, ...readRecent().filter((r) => r !== word)].slice(
      0,
      RECENT_MAX,
    )
    writeRecent(next)
    setRecent(next)
  }

  const { data, isLoading, isFetching, error } = usePosts({
    keyword: keyword || undefined,
    scope,
    sort,
    topic,
    period,
    hasImage: hasImage || undefined,
    size: PAGE_SIZE * pages,
    ...(mineOnly ? { author: "me" } : {}),
  })
  const posts = data?.items ?? []
  const total = data?.totalElements ?? 0
  const words = scope === "author" ? [] : keyword.split(/\s+/).filter(Boolean)
  const filtering = !!keyword || !!topic || period !== "all" || hasImage
  const extraFilters = (period !== "all" ? 1 : 0) + (hasImage ? 1 : 0)

  function removeRecent(word: string) {
    const next = recent.filter((r) => r !== word)
    writeRecent(next)
    setRecent(next)
  }

  function resetAll() {
    setDraft("")
    update({ q: null, scope: null, topic: null, period: null, img: null })
  }

  const emptyText = error
    ? error.message
    : isLoading
      ? "불러오는 중..."
      : filtering
        ? "조건에 맞는 글이 없어요"
        : "아직 글이 없어요"

  const searchBox = (pc: boolean) => (
    <div
      className={cn(
        "flex items-center gap-2 bg-surface",
        pc
          ? "h-11 w-[340px] max-w-full rounded-[14px] px-3 shadow-[0_0_0_1px_#EDEDEB]"
          : "h-[46px] rounded-[14px] px-3 shadow-card",
      )}
    >
      <select
        value={scope}
        onChange={(e) =>
          update({ scope: e.target.value === "all" ? null : e.target.value })
        }
        aria-label="검색 범위"
        className="flex-none bg-transparent text-[13px] font-bold text-sub outline-none"
      >
        {SCOPES.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>
      <span className="h-4 w-px flex-none bg-line-2" />
      <Search className="size-[18px] flex-none text-faint" />
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={saveRecent}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            saveRecent()
            e.currentTarget.blur()
          }
        }}
        enterKeyHint="search"
        placeholder={
          scope === "author"
            ? "닉네임 검색"
            : "검색어 입력 (띄어 쓰면 모두 포함)"
        }
        className={cn(
          "min-w-0 flex-1 bg-transparent outline-none",
          pc ? "text-sm" : "text-[15px]",
        )}
      />
      {draft && (
        <button
          type="button"
          onClick={() => setDraft("")}
          aria-label="검색어 지우기"
        >
          <X className="size-4 text-faint" />
        </button>
      )}
    </div>
  )

  const recentChips = recent.length > 0 && !draft && (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="flex items-center gap-1 pr-0.5 text-xs font-semibold text-muted">
        <Clock className="size-3.5" />
        최근 검색
      </span>
      {recent.map((word) => (
        <span
          key={word}
          className="flex items-center gap-1 rounded-full bg-surface py-1 pr-1.5 pl-2.5 text-xs font-semibold shadow-card"
        >
          <button type="button" onClick={() => setDraft(word)}>
            {word}
          </button>
          <button
            type="button"
            onClick={() => removeRecent(word)}
            aria-label={`${word} 지우기`}
          >
            <X className="size-3 text-faint" />
          </button>
        </span>
      ))}
    </div>
  )

  const topicChips = (
    <div className="flex [scrollbar-width:none] gap-1.5 overflow-x-auto">
      {[
        { key: undefined, label: "전체" } as {
          key: PostTopic | undefined
          label: string
        },
        ...POST_TOPICS,
      ].map((t) => (
        <button
          key={t.label}
          type="button"
          aria-pressed={topic === t.key}
          onClick={() => update({ topic: t.key ?? null })}
          className={cn(
            "flex-none rounded-full px-3.5 py-2 text-[13px] font-bold",
            topic === t.key
              ? "bg-ink text-white"
              : "bg-surface text-sub shadow-card",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )

  const sortTabs = (pc: boolean) =>
    SORTS.map((t) => (
      <button
        key={t.key}
        type="button"
        onClick={() =>
          update({ sort: t.key === (mineOnly ? "new" : "hot") ? null : t.key })
        }
        className={cn(
          "-mb-px border-b-2 text-[15px]",
          pc ? "pt-4 pb-3.5" : "py-2.5",
          sort === t.key
            ? "border-ink font-bold text-ink"
            : "border-transparent font-semibold text-faint",
        )}
      >
        {t.label}
      </button>
    ))

  const activeFilters = (filtering || mineOnly) && (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="font-semibold text-sub tabular-nums">
        {mineOnly ? "내가 쓴 글 · " : ""}글 {total}개
      </span>
      {period !== "all" && (
        <button
          type="button"
          onClick={() => update({ period: null })}
          className="flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 font-bold text-white"
        >
          {PERIODS.find((p) => p.key === period)?.label}
          <X className="size-3" />
        </button>
      )}
      {hasImage && (
        <button
          type="button"
          onClick={() => update({ img: null })}
          className="flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 font-bold text-white"
        >
          사진 있는 글
          <X className="size-3" />
        </button>
      )}
      {filtering && (
        <button
          type="button"
          onClick={resetAll}
          className="flex items-center gap-1 font-semibold text-muted"
        >
          <RotateCcw className="size-3" />
          초기화
        </button>
      )}
    </div>
  )

  const list = (pc: boolean) => (
    <>
      {posts.map((p) => (
        <PostRow key={p.id} post={p} now={now} words={words} pc={pc} />
      ))}
      {posts.length === 0 && (
        <div className="py-[60px] text-center text-sm text-faint">
          {emptyText}
        </div>
      )}
      {posts.length < total && (
        <button
          type="button"
          onClick={() => setPager({ key: filterKey, n: pages + 1 })}
          disabled={isFetching}
          className={cn(
            "mx-auto my-4 flex h-11 items-center rounded-[13px] px-5 text-sm font-bold disabled:opacity-60",
            pc ? "bg-track" : "bg-surface shadow-card",
          )}
        >
          {isFetching ? "불러오는 중..." : `더 보기 (${total - posts.length})`}
        </button>
      )}
    </>
  )

  const filterButton = (pc: boolean) => (
    <button
      type="button"
      onClick={() => setFilterOpen(true)}
      className={cn(
        "relative ml-auto flex items-center gap-1 text-[13px] font-bold",
        extraFilters > 0 ? "text-brand" : "text-sub",
        pc ? "py-4" : "py-2.5",
      )}
    >
      <SlidersHorizontal className="size-4" />
      필터{extraFilters > 0 && ` ${extraFilters}`}
    </button>
  )

  return (
    <>
      {/* 모바일 */}
      <div className="pb-[110px] lg:hidden">
        <div className="flex items-center justify-between px-5 pt-2 pb-2.5">
          <h1 className="text-2xl font-extrabold tracking-[-0.04em]">
            커뮤니티
          </h1>
          <button
            type="button"
            onClick={() => {
              if (searchOpen) {
                setDraft("")
                update({ q: null, scope: null })
              }
              setSearchOpen((o) => !o)
            }}
            className="p-1"
            aria-label={searchOpen ? "검색 닫기" : "검색"}
          >
            {searchOpen ? (
              <X className="size-6" />
            ) : (
              <Search className="size-6" />
            )}
          </button>
        </div>
        {searchOpen && (
          <div className="flex flex-col gap-2.5 px-4 pb-3">
            {searchBox(false)}
            {recentChips}
          </div>
        )}
        <div className="px-4 pb-2.5">{topicChips}</div>
        <div className="flex gap-5 border-b border-line-2 px-5">
          {sortTabs(false)}
          {filterButton(false)}
        </div>
        {activeFilters && <div className="px-5 pt-3">{activeFilters}</div>}
        <div className="flex flex-col">{list(false)}</div>
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
            <h1 className="text-[30px] font-extrabold tracking-[-0.04em]">
              커뮤니티
            </h1>
            <span className="flex-1" />
            {searchBox(true)}
          </div>
          {recentChips}
          {topicChips}
          <div className="overflow-hidden rounded-3xl bg-surface">
            <div className="flex gap-[22px] border-b border-line px-6">
              {sortTabs(true)}
              {filterButton(true)}
            </div>
            {activeFilters && (
              <div className="border-b border-line-3 px-6 py-3">
                {activeFilters}
              </div>
            )}
            <div className="flex flex-col">{list(true)}</div>
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

      <BoardFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        period={period}
        hasImage={hasImage}
        onApply={(next) =>
          update({
            period: next.period === "all" ? null : next.period,
            img: next.hasImage ? "1" : null,
          })
        }
      />
    </>
  )
}

function PostRow({
  post,
  now,
  words,
  pc = false,
}: {
  post: PostListItem
  now: Date
  words: string[]
  pc?: boolean
}) {
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
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          pc ? "gap-[7px]" : "gap-1.5",
        )}
      >
        <span
          className={cn(
            "leading-[1.4] font-bold",
            pc ? "text-base" : "text-[15px]",
          )}
        >
          <TopicBadge topic={post.topic} className="mr-1.5 align-[2px]" />
          <Highlight text={post.title} words={words} />
        </span>
        {post.contentPreview && (
          <span
            className={cn(
              "truncate leading-[1.5] text-sub",
              pc ? "text-sm" : "text-[13px]",
            )}
          >
            <Highlight text={post.contentPreview} words={words} />
          </span>
        )}
        <div
          className={cn(
            "flex items-center text-xs text-faint",
            pc ? "gap-3" : "gap-2.5",
          )}
        >
          <span>
            {post.authorNickname} · {timeAgo(post.createdAt, now)}
          </span>
          <span
            className={cn(
              "flex items-center",
              pc ? "gap-[3px]" : "gap-0.5",
              post.likedByMe && "text-danger",
            )}
          >
            <Heart className={pc ? "size-[13px]" : "size-3.5"} />
            {post.likeCount}
          </span>
          <span
            className={cn("flex items-center", pc ? "gap-[3px]" : "gap-0.5")}
          >
            <MessageCircle className={pc ? "size-[13px]" : "size-3.5"} />
            {post.replyCount}
          </span>
          {(post.imageCount ?? 0) > 1 && (
            <span
              className={cn("flex items-center", pc ? "gap-[3px]" : "gap-0.5")}
            >
              <ImageIcon className={pc ? "size-[13px]" : "size-3.5"} />
              {post.imageCount}
            </span>
          )}
        </div>
      </div>
      {post.thumbnailUrl && (
        <ImageBox
          src={post.thumbnailUrl}
          className={
            pc
              ? "size-[88px] flex-none rounded-[14px]"
              : "size-[66px] flex-none rounded-xl"
          }
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
          <Link
            key={issue.id}
            href={`/issue/${issue.id}`}
            className="flex items-center gap-3 border-t border-line-3 py-2.5"
          >
            <ImageBox
              src={issue.coverImageUrl}
              className="size-[46px] flex-none rounded-xl"
              iconSize={18}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span className="truncate text-sm font-semibold">
                {issue.title}
              </span>
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
