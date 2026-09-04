"use client"

import { useState } from "react"

import type { Reply } from "@/lib/api"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

type ReplySectionProps = {
  replies: Reply[]
  currentUserId?: number
  onSubmit: (content: string) => Promise<void>
  onDelete: (replyId: number) => Promise<void>
  onRequireLogin: () => void
}

const MAX_LENGTH = 1000

function formatReplyTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * 이슈 상세 댓글과 게시판 댓글 양쪽에서 그대로 재사용하는 댓글 섹션.
 * 어느 쪽에 달리는 댓글인지는 이 컴포넌트가 몰라도 되도록 onSubmit/onDelete로 위임한다
 * (issueId/postId 분기는 각 페이지가 lib/api.ts의 createIssueReply/createPostReply로 처리).
 */
export function ReplySection({
  replies,
  currentUserId,
  onSubmit,
  onDelete,
  onRequireLogin,
}: ReplySectionProps) {
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!currentUserId) {
      onRequireLogin()
      return
    }
    const trimmed = content.trim()
    if (!trimmed) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      await onSubmit(trimmed)
      setContent("")
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "댓글을 남기지 못했습니다")
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    if (pendingDeleteId == null) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await onDelete(pendingDeleteId)
      setPendingDeleteId(null)
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "댓글을 삭제하지 못했습니다")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-6">
      <div className="flex items-center gap-2">
        <h2 className="text-h3">댓글</h2>
        <span className="text-caption text-ink-subtle tabular-nums">{replies.length}개</span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={MAX_LENGTH}
          rows={3}
          placeholder={currentUserId ? "댓글을 남겨보세요" : "로그인하면 댓글을 남길 수 있어요"}
          className="w-full resize-none rounded-xl border border-line bg-control p-3 text-label text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
        />
        <div className="flex items-center gap-3">
          {submitError && <span className="text-caption text-wrong">{submitError}</span>}
          <div className="flex-auto" />
          <span className="text-caption text-ink-faint tabular-nums">
            {content.length}/{MAX_LENGTH}
          </span>
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-label font-semibold text-accent-ink transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
          >
            등록
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-3">
        {replies.length === 0 && (
          <p className="text-caption text-ink-faint">아직 댓글이 없어요. 첫 댓글을 남겨보세요.</p>
        )}
        {replies.map((reply) => (
          <div
            key={reply.id}
            className="flex flex-col gap-1 border-b border-line pb-3 last:border-none last:pb-0"
          >
            <div className="flex items-center gap-2">
              <span className="text-label font-semibold text-ink">{reply.authorNickname}</span>
              <span className="text-caption text-ink-faint tabular-nums">
                {formatReplyTime(reply.createdAt)}
              </span>
              <div className="flex-auto" />
              {reply.authorId === currentUserId && (
                <button
                  type="button"
                  onClick={() => setPendingDeleteId(reply.id)}
                  className="text-caption text-ink-faint hover:text-wrong"
                >
                  삭제
                </button>
              )}
            </div>
            <p className="text-label text-pretty whitespace-pre-wrap text-ink">{reply.content}</p>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        title="댓글을 삭제할까요?"
        description="삭제한 댓글은 되돌릴 수 없어요."
        confirmLabel="삭제"
        variant="destructive"
        loading={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
