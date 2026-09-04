"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Eye, MessageCircle, PenSquare, Search } from "lucide-react"

import { useMe } from "@/lib/queries/auth"
import { usePosts } from "@/lib/queries/post"
import { Pagination } from "@/components/admin/pagination"

const PAGE_SIZE = 20

function formatPostTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  })
}

export default function BoardPage() {
  const router = useRouter()
  const [keyword, setKeyword] = useState("")
  const [keywordInput, setKeywordInput] = useState("")
  const [page, setPage] = useState(0)

  const { data: me } = useMe()
  const {
    data: listResult,
    isLoading: loading,
    error,
  } = usePosts({ keyword: keyword || undefined, page, size: PAGE_SIZE })
  const items = listResult?.items ?? []
  const totalPages = listResult?.totalPages ?? 0
  const totalElements = listResult?.totalElements ?? 0

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(0)
    setKeyword(keywordInput.trim())
  }

  function handleWriteClick() {
    if (!me) {
      router.push("/login")
      return
    }
    router.push("/board/write")
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-8 pb-11 sm:px-6">
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-h1">커뮤니티</h1>
          <span className="text-caption text-ink-subtle tabular-nums">
            {totalElements.toLocaleString()}건
          </span>
          <div className="flex-auto" />
          <button
            type="button"
            onClick={handleWriteClick}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-label font-semibold text-accent-ink transition-opacity hover:opacity-90"
          >
            <PenSquare size={15} />
            글쓰기
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-faint" />
            <input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="제목으로 검색"
              className="w-full rounded-xl border border-line bg-control py-2.5 pr-3.5 pl-10 text-label text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-line bg-card px-4 py-2.5 text-label text-ink-muted transition-colors hover:text-ink"
          >
            <Search className="size-4" />
          </button>
        </form>

        {loading ? (
          <div className="text-label text-ink-subtle">불러오는 중...</div>
        ) : error ? (
          <div className="rounded-xl border border-dashed border-line-strong px-5 py-10 text-center text-label text-ink-subtle">
            {error.message}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-strong px-5 py-10 text-center text-label text-ink-subtle">
            {keyword
              ? "검색 결과가 없어요"
              : "아직 글이 없어요. 첫 글을 남겨보세요"}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {items.map((post) => (
              <article
                key={post.id}
                onClick={() => router.push(`/board/${post.id}`)}
                className="flex cursor-pointer flex-col gap-1.5 rounded-xl border border-line bg-card px-5 py-4 transition-colors hover:border-accent"
              >
                <h2 className="text-h3 text-pretty text-ink">{post.title}</h2>
                <div className="flex items-center gap-2.5 text-caption text-ink-faint tabular-nums">
                  <span>{post.authorNickname}</span>
                  <span>·</span>
                  <span>{formatPostTime(post.createdAt)}</span>
                  <span className="flex-auto" />
                  <span className="flex items-center gap-1">
                    <Eye size={13} />
                    {post.viewCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={13} />
                    {post.replyCount}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  )
}
