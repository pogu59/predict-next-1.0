"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { useMe } from "@/lib/queries/auth"
import { useCreatePost } from "@/lib/queries/post"

export default function BoardWritePage() {
  const router = useRouter()
  const { data: me, isLoading: meLoading } = useMe()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const createPost = useCreatePost()

  useEffect(() => {
    if (!meLoading && !me) router.replace("/login")
  }, [meLoading, me, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    const post = await createPost.mutateAsync({ title: title.trim(), content: content.trim() })
    router.replace(`/board/${post.id}`)
  }

  if (meLoading || !me) {
    return (
      <div className="flex flex-col gap-5 px-6 pt-8 pb-11">
        <div className="text-label text-ink-subtle">불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-8 pb-11 sm:px-6">
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5">
        <h1 className="text-h1">글쓰기</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="제목"
            className="w-full rounded-xl border border-line bg-control px-4 py-3 text-label text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={14}
            placeholder="내용을 입력하세요"
            className="w-full resize-none rounded-xl border border-line bg-control p-4 text-label text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
          />

          {createPost.error && <span className="text-caption text-wrong">{createPost.error.message}</span>}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => router.push("/board")}
              className="rounded-lg border border-line-strong bg-control px-4 py-2.5 text-label text-ink-muted transition-colors hover:text-ink"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={createPost.isPending || !title.trim() || !content.trim()}
              className="rounded-lg bg-accent px-4 py-2.5 text-label font-semibold text-accent-ink transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
            >
              {createPost.isPending ? "등록 중..." : "등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
