"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

import { useMe } from "@/lib/queries/auth"
import { useDeletePost, useDeletePostReply, useCreatePostReply, usePost, usePostReplies } from "@/lib/queries/post"
import { Icon } from "@/components/icon"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ReplySection } from "@/components/replies/replySection"

function formatPostTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function BoardDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const postId = Number(params.id)

  const { data: me } = useMe()
  const { data: post, isLoading: loading, error } = usePost(postId)
  const { data: replies = [] } = usePostReplies(postId)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(false)

  const createReply = useCreatePostReply(postId)
  const deleteReply = useDeletePostReply(postId)
  const deletePost = useDeletePost(postId)

  async function handleReplySubmit(content: string) {
    await createReply.mutateAsync(content)
  }

  async function handleReplyDelete(replyId: number) {
    await deleteReply.mutateAsync(replyId)
  }

  async function confirmDeletePost() {
    await deletePost.mutateAsync()
    router.replace("/board")
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-5 px-6 pt-8 pb-11">
        <div className="text-label text-ink-subtle">불러오는 중...</div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="flex flex-col gap-5 px-6 pt-8 pb-11">
        <div className="rounded-xl border border-dashed border-line-strong px-5 py-10 text-center text-label text-ink-subtle">
          {error?.message ?? "존재하지 않는 글입니다"}
        </div>
      </div>
    )
  }

  const mine = me?.userId === post.authorId

  return (
    <div className="flex flex-col gap-[22px] px-4 pt-8 pb-11 sm:px-6">
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-[14px]">
        <button
          type="button"
          onClick={() => router.push("/board")}
          className="flex items-center gap-1.5 self-start text-label text-ink-subtle hover:text-ink"
        >
          <Icon name="arrow_back" filled={false} size={18} />
          커뮤니티
        </button>

        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-6">
          <div className="flex items-start gap-2">
            <h1 className="flex-auto text-h1 text-pretty">{post.title}</h1>
            {mine && (
              <button
                type="button"
                onClick={() => setPendingDelete(true)}
                className="text-caption text-ink-faint hover:text-wrong"
              >
                삭제
              </button>
            )}
          </div>
          <div className="flex items-center gap-2.5 text-caption text-ink-faint tabular-nums">
            <span>{post.authorNickname}</span>
            <span>·</span>
            <span>{formatPostTime(post.createdAt)}</span>
            <span>·</span>
            <span>조회 {post.viewCount}</span>
          </div>
          <p className="text-label text-pretty whitespace-pre-wrap text-ink">{post.content}</p>
        </div>

        <ReplySection
          replies={replies}
          currentUserId={me?.userId}
          onSubmit={handleReplySubmit}
          onDelete={handleReplyDelete}
          onRequireLogin={() => setShowLoginPrompt(true)}
        />
      </div>

      <ConfirmDialog
        open={pendingDelete}
        onOpenChange={setPendingDelete}
        title="글을 삭제할까요?"
        description="삭제한 글은 되돌릴 수 없어요. 댓글도 함께 보이지 않게 됩니다."
        confirmLabel="삭제"
        variant="destructive"
        loading={deletePost.isPending}
        error={deletePost.error?.message ?? null}
        onConfirm={confirmDeletePost}
      />

      <ConfirmDialog
        open={showLoginPrompt}
        onOpenChange={setShowLoginPrompt}
        title="로그인이 필요해요"
        description="로그인하면 댓글을 남길 수 있어요."
        confirmLabel="로그인하러 가기"
        cancelLabel="닫기"
        onConfirm={() => router.push("/login")}
      />
    </div>
  )
}
