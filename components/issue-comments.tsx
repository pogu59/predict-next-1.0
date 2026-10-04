"use client"

import { Heart } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import type { Issue, Reply } from "@/lib/api"
import { timeAgo } from "@/lib/issues"
import {
  useCreateIssueReply,
  useDeleteIssueReply,
  useLikeIssueReply,
  useReportIssueReply,
} from "@/lib/queries/issue"
import { cn } from "@/lib/utils"
import { CommentInput } from "@/components/comment-input"
import { Avatar } from "@/components/ui/brand"
import { ConfirmDialog, ReportSheet } from "@/components/ui/overlay"
import { useToast } from "@/components/ui/toast"

type IssueCommentsProps = {
  issue: Issue
  replies: Reply[]
  currentUserId?: number
  now: Date
}

/**
 * 이슈 댓글. 누구나 작성, 좋아요 토글, 작성자가 투표했다면 현재 선택지 뱃지.
 * 내 댓글은 삭제(확인), 남의 댓글은 신고(사유 시트).
 * 모바일은 흰 시트(상단 radius 26), PC는 흰 카드(radius 24).
 */
export function IssueComments({ issue, replies, currentUserId, now }: IssueCommentsProps) {
  const router = useRouter()
  const showToast = useToast()
  const [draft, setDraft] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [reportId, setReportId] = useState<number | null>(null)

  const create = useCreateIssueReply(issue.id)
  const remove = useDeleteIssueReply(issue.id)
  const like = useLikeIssueReply(issue.id)
  const report = useReportIssueReply(issue.id)

  const optionText = (id: number | null) => issue.options.find((o) => o.id === id)?.text

  function submit() {
    const body = draft.trim()
    if (!body || create.isPending) return
    if (!currentUserId) {
      router.push("/login")
      return
    }
    create.mutate(body, {
      onSuccess: () => setDraft(""),
      onError: (e) => showToast(e.message),
    })
  }

  function toggleLike(replyId: number) {
    if (!currentUserId) {
      router.push("/login")
      return
    }
    like.mutate(replyId)
  }

  return (
    <div className="mt-[22px] flex min-h-[300px] flex-col gap-[18px] rounded-t-[26px] bg-surface px-5 pt-5 pb-7 lg:mt-0 lg:min-h-0 lg:rounded-3xl lg:p-6">
      <div className="flex items-baseline gap-1.5">
        <span className="text-[17px] font-extrabold lg:text-lg">댓글</span>
        <span className="text-[15px] font-bold text-faint">{replies.length}</span>
      </div>
      <CommentInput
        value={draft}
        onChange={setDraft}
        onSubmit={submit}
        placeholder="의견을 남겨주세요"
        disabled={create.isPending}
      />
      {replies.map((c) => {
        const mine = c.authorId === currentUserId
        const choice = optionText(c.authorOptionId)
        return (
          <div key={c.id} className="flex gap-2.5 lg:gap-3 lg:pt-1">
            <Avatar
              nickname={c.authorNickname}
              tone="colorful"
              className="size-[34px] text-[13px] lg:size-[38px] lg:text-sm"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-[5px] lg:gap-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[13px] font-bold lg:text-sm">{c.authorNickname}</span>
                {choice && (
                  <span className="rounded-[5px] bg-brand-soft px-[7px] py-0.5 text-[11px] font-bold text-brand">
                    {choice}
                  </span>
                )}
                <span className="text-xs text-faint">{timeAgo(c.createdAt, now)}</span>
              </div>
              <span className="text-sm leading-[1.55] break-all text-ink-2 lg:text-[15px] lg:leading-[1.6]">
                {c.content}
              </span>
              <div className="flex items-center gap-3.5 lg:gap-4">
                <button
                  type="button"
                  onClick={() => toggleLike(c.id)}
                  className={cn(
                    "flex items-center gap-1 text-xs lg:text-[13px]",
                    c.likedByMe ? "text-danger" : "text-muted",
                  )}
                >
                  <Heart className="size-4 lg:size-[15px]" />
                  {c.likeCount}
                </button>
                <button
                  type="button"
                  onClick={() => (mine ? setDeleteId(c.id) : currentUserId ? setReportId(c.id) : router.push("/login"))}
                  className="text-xs text-faint lg:text-[13px]"
                >
                  {mine ? "삭제" : "신고"}
                </button>
              </div>
            </div>
          </div>
        )
      })}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="댓글을 삭제할까요?"
        description="삭제한 댓글은 복구할 수 없어요."
        confirmLabel="삭제"
        loading={remove.isPending}
        onConfirm={() =>
          deleteId !== null &&
          remove.mutate(deleteId, {
            onSuccess: () => setDeleteId(null),
            onError: (e) => showToast(e.message),
          })
        }
      />
      <ReportSheet
        open={reportId !== null}
        onOpenChange={(open) => !open && setReportId(null)}
        onSelect={(reason) => {
          if (reportId === null) return
          report.mutate({ replyId: reportId, reason }, { onSuccess: () => showToast("신고가 접수됐어요") })
        }}
      />
    </div>
  )
}
