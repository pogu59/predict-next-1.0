"use client"

import { ChevronLeft, CornerDownRight, Ellipsis, Heart, MessageCircle, X } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

import type { Reply } from "@/lib/api"
import { timeAgo, useNow } from "@/lib/issues"
import { useMe } from "@/lib/queries/auth"
import {
  useCreatePostReply,
  useDeletePost,
  useDeletePostReply,
  useHidePostAuthor,
  useLikePost,
  useLikePostReply,
  usePost,
  usePostReplies,
  useReportPost,
  useReportPostReply,
} from "@/lib/queries/post"
import { cn } from "@/lib/utils"
import { CommentInput } from "@/components/comment-input"
import { Avatar, CrewBadge } from "@/components/ui/brand"
import { ImageBox } from "@/components/ui/image-box"
import { ActionSheet, ConfirmDialog, ReportSheet, type SheetItem } from "@/components/ui/overlay"
import { useToast } from "@/components/ui/toast"

type ReportTarget = { kind: "post" } | { kind: "reply"; replyId: number }

export default function PostDetailPage() {
  const params = useParams<{ id: string }>()
  const postId = Number(params.id)
  const router = useRouter()
  const showToast = useToast()
  const now = useNow(60_000)

  const { data: me } = useMe()
  const { data: post, isLoading, error } = usePost(postId)
  const { data: replies = [] } = usePostReplies(postId)

  const likePost = useLikePost(postId)
  const deletePost = useDeletePost(postId)
  const reportPost = useReportPost(postId)
  const hideAuthor = useHidePostAuthor(postId)
  const createReply = useCreatePostReply(postId)
  const deleteReply = useDeletePostReply(postId)
  const likeReply = useLikePostReply(postId)
  const reportReply = useReportPostReply(postId)

  const [draft, setDraft] = useState("")
  const [replyTo, setReplyTo] = useState<{ id: number; nickname: string } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null)
  const [confirm, setConfirm] = useState<{ kind: "post" } | { kind: "reply"; replyId: number } | null>(null)

  function requireLogin() {
    if (me) return false
    router.push("/login")
    return true
  }

  function goBack() {
    if (window.history.length > 1) router.back()
    else router.push("/board")
  }

  if (isLoading || error || !post) {
    return (
      <div className="min-h-dvh bg-surface py-20 text-center text-sm text-faint lg:min-h-0 lg:bg-transparent">
        {isLoading ? "불러오는 중..." : (error?.message ?? "존재하지 않는 게시글입니다")}
      </div>
    )
  }

  const mine = post.authorId === me?.userId
  const commentCount = replies.reduce((n, c) => n + 1 + c.replies.length, 0)

  function submitComment() {
    const body = draft.trim()
    if (!body || createReply.isPending || requireLogin()) return
    createReply.mutate(
      { content: body, parentId: replyTo?.id },
      {
        onSuccess: () => {
          setDraft("")
          setReplyTo(null)
        },
        onError: (e) => showToast(e.message),
      },
    )
  }

  function commentMenu(c: Reply) {
    if (c.authorId === me?.userId) setConfirm({ kind: "reply", replyId: c.id })
    else if (!requireLogin()) setReportTarget({ kind: "reply", replyId: c.id })
  }

  const menuItems: SheetItem[] = mine
    ? [
        {
          label: "수정하기",
          onSelect: () => {
            setMenuOpen(false)
            router.push(`/board/${post.id}/edit`)
          },
        },
        {
          label: "삭제하기",
          danger: true,
          onSelect: () => {
            setMenuOpen(false)
            setConfirm({ kind: "post" })
          },
        },
      ]
    : [
        {
          label: "신고하기",
          danger: true,
          onSelect: () => {
            setMenuOpen(false)
            if (!requireLogin()) setReportTarget({ kind: "post" })
          },
        },
        {
          label: "이 사용자의 글 숨기기",
          onSelect: () => {
            setMenuOpen(false)
            hideAuthor.mutate(undefined, { onSuccess: () => showToast("앞으로 이 사용자의 글이 보이지 않아요") })
          },
        },
      ]

  const likeButton = (pc: boolean) => (
    <button
      type="button"
      onClick={() => !requireLogin() && likePost.mutate()}
      className={cn(
        "flex items-center gap-1.5 rounded-full border-[1.5px] text-sm font-bold",
        pc ? "px-4 py-2.5" : "px-3.5 py-[9px]",
        post.likedByMe ? "border-[#FFC9CE] text-danger" : "border-line text-sub",
      )}
    >
      <Heart className={pc ? "size-[17px]" : "size-[18px]"} />
      {post.likeCount}
    </button>
  )

  const commentPill = (pc: boolean) => (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-full border-[1.5px] border-line text-sm font-bold text-sub",
        pc ? "px-4 py-2.5" : "px-3.5 py-[9px]",
      )}
    >
      <MessageCircle className={pc ? "size-[17px]" : "size-[18px]"} />
      {commentCount}
    </span>
  )

  const replyBanner = (pc: boolean) =>
    replyTo && (
      <div
        className={cn(
          "flex items-center gap-1.5 font-semibold text-brand",
          pc ? "text-[13px]" : "px-1.5 py-0.5 text-xs",
        )}
      >
        <CornerDownRight className="size-[15px]" />
        {replyTo.nickname}님에게 답글
        <span className="flex-1" />
        <button type="button" onClick={() => setReplyTo(null)} aria-label="답글 취소">
          <X className="size-4 text-faint" />
        </button>
      </div>
    )

  const comments = (pc: boolean) => (
    <>
      {replies.map((c) => (
        <div key={c.id} className="flex flex-col gap-3.5">
          <CommentItem
            reply={c}
            pc={pc}
            now={now}
            mine={c.authorId === me?.userId}
            onLike={() => !requireLogin() && likeReply.mutate(c.id)}
            onReply={() => !requireLogin() && setReplyTo({ id: c.id, nickname: c.authorNickname })}
            onMenu={() => commentMenu(c)}
          />
          {c.replies.map((r) => (
            <CommentItem
              key={r.id}
              reply={r}
              pc={pc}
              now={now}
              nested
              mine={r.authorId === me?.userId}
              onLike={() => !requireLogin() && likeReply.mutate(r.id)}
              onMenu={() => commentMenu(r)}
            />
          ))}
        </div>
      ))}
      {replies.length === 0 && <span className="py-5 text-center text-sm text-faint">첫 댓글을 남겨보세요</span>}
    </>
  )

  const placeholder = replyTo ? "답글을 입력하세요" : "댓글을 입력하세요"

  return (
    <>
      {/* 모바일 */}
      <div className="min-h-dvh bg-surface pb-24 lg:hidden">
        <div className="sticky top-0 z-20 flex h-[52px] items-center justify-between bg-surface px-3">
          <button type="button" onClick={goBack} className="p-2" aria-label="뒤로">
            <ChevronLeft className="size-6" />
          </button>
          <button type="button" onClick={() => setMenuOpen(true)} className="p-2" aria-label="더보기">
            <Ellipsis className="size-6" />
          </button>
        </div>
        <div className="flex flex-col gap-3.5 border-b-8 border-bg px-5 pt-1 pb-5">
          <div className="flex items-center gap-2.5">
            <Avatar nickname={post.authorNickname} className="size-9 text-sm" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold">
                {post.authorNickname} <CrewBadge name={post.authorCrewName} />
              </span>
              <span className="text-xs text-faint">{timeAgo(post.createdAt, now)}</span>
            </div>
          </div>
          <h1 className="text-[21px] leading-[1.4] font-extrabold tracking-[-0.03em]">{post.title}</h1>
          <p className="text-[15px] leading-[1.7] break-all whitespace-pre-wrap text-ink-2">{post.content}</p>
          {post.images.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5">
              {post.images.map((src) => (
                <ImageBox key={src} src={src} className="aspect-square rounded-[14px]" />
              ))}
            </div>
          )}
          <div className="flex gap-2">
            {likeButton(false)}
            {commentPill(false)}
          </div>
        </div>
        <div className="flex flex-col gap-[18px] px-5 py-[18px]">{comments(false)}</div>
        <div className="fixed inset-x-0 bottom-0 z-30 flex flex-col gap-1.5 border-t border-line bg-surface px-3 pt-2 pb-6">
          {replyBanner(false)}
          <CommentInput value={draft} onChange={setDraft} onSubmit={submitComment} placeholder={placeholder} />
        </div>
      </div>

      {/* PC */}
      <div className="mx-auto hidden max-w-[780px] flex-col gap-4 lg:flex">
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-1 self-start text-sm font-semibold text-sub"
        >
          <ChevronLeft className="size-[18px]" />
          커뮤니티
        </button>
        <div className="flex flex-col gap-4 rounded-3xl bg-surface p-7">
          <div className="flex items-center gap-2.5">
            <Avatar nickname={post.authorNickname} className="size-10 text-[15px]" />
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-bold">
                {post.authorNickname} <CrewBadge name={post.authorCrewName} />
              </span>
              <span className="text-xs text-faint">{timeAgo(post.createdAt, now)}</span>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="rounded-[10px] p-2 text-sub"
              aria-label="더보기"
            >
              <Ellipsis className="size-[22px]" />
            </button>
          </div>
          <h1 className="text-[26px] leading-[1.4] font-extrabold tracking-[-0.03em]">{post.title}</h1>
          <p className="text-base leading-[1.75] break-all whitespace-pre-wrap text-ink-2">{post.content}</p>
          {post.images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {post.images.map((src) => (
                <ImageBox key={src} src={src} className="aspect-square rounded-2xl" />
              ))}
            </div>
          )}
          <div className="flex gap-2">
            {likeButton(true)}
            {commentPill(true)}
          </div>
        </div>
        <div className="flex flex-col gap-[18px] rounded-3xl bg-surface px-7 py-6">
          <div className="flex flex-col gap-1.5">
            {replyBanner(true)}
            <CommentInput value={draft} onChange={setDraft} onSubmit={submitComment} placeholder={placeholder} />
          </div>
          {comments(true)}
        </div>
      </div>

      <ActionSheet open={menuOpen} onOpenChange={setMenuOpen} items={menuItems} />
      <ReportSheet
        open={reportTarget !== null}
        onOpenChange={(open) => !open && setReportTarget(null)}
        onSelect={(reason) => {
          const done = { onSuccess: () => showToast("신고가 접수됐어요") }
          if (reportTarget?.kind === "post") reportPost.mutate(reason, done)
          else if (reportTarget?.kind === "reply") reportReply.mutate({ replyId: reportTarget.replyId, reason }, done)
        }}
      />
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm?.kind === "post" ? "글을 삭제할까요?" : "댓글을 삭제할까요?"}
        description={
          confirm?.kind === "post" ? "댓글도 함께 삭제되며 복구할 수 없어요." : "삭제한 댓글은 복구할 수 없어요."
        }
        confirmLabel="삭제"
        loading={deletePost.isPending || deleteReply.isPending}
        onConfirm={() => {
          if (confirm?.kind === "post") {
            deletePost.mutate(undefined, {
              onSuccess: () => {
                setConfirm(null)
                router.replace("/board")
                showToast("글을 삭제했어요")
              },
              onError: (e) => showToast(e.message),
            })
          } else if (confirm?.kind === "reply") {
            deleteReply.mutate(confirm.replyId, {
              onSuccess: () => setConfirm(null),
              onError: (e) => showToast(e.message),
            })
          }
        }}
      />
    </>
  )
}

type CommentItemProps = {
  reply: Reply
  pc: boolean
  now: Date
  nested?: boolean
  mine: boolean
  onLike: () => void
  onReply?: () => void
  onMenu: () => void
}

/** 게시글 댓글 한 줄. nested면 들여쓰기 + corner-down-right 아이콘(대댓글은 1단계까지). */
function CommentItem({ reply, pc, now, nested = false, mine, onLike, onReply, onMenu }: CommentItemProps) {
  const avatarClass = nested
    ? pc
      ? "size-[30px] text-xs"
      : "size-7 text-[11px]"
    : pc
      ? "size-9 text-[13px]"
      : "size-8 text-xs"
  const heartClass = nested ? (pc ? "size-3.5" : "size-[15px]") : pc ? "size-[15px]" : "size-4"

  return (
    <div className={cn("flex", nested ? (pc ? "gap-2.5 pl-[34px]" : "gap-2 pl-7") : pc ? "gap-3" : "gap-2.5")}>
      {nested && (
        <CornerDownRight className={cn("flex-none text-[#D0D0D4]", pc ? "mt-2 size-[17px]" : "mt-1.5 size-[18px]")} />
      )}
      <Avatar nickname={reply.authorNickname} tone="neutral" className={avatarClass} />
      <div className={cn("flex min-w-0 flex-1 flex-col", nested ? (pc ? "gap-[5px]" : "gap-1") : pc ? "gap-1.5" : "gap-[5px]")}>
        <div className="flex items-center gap-1.5">
          <span className={cn("font-bold", pc ? "text-sm" : "text-[13px]")}>{reply.authorNickname}</span>
          <CrewBadge name={reply.authorCrewName} />
          <span className="text-xs text-faint">{timeAgo(reply.createdAt, now)}</span>
        </div>
        <span className={cn("break-all text-ink-2", pc ? "text-[15px] leading-[1.6]" : "text-sm leading-[1.55]")}>
          {reply.content}
        </span>
        <div className={cn("flex items-center text-faint", pc ? "gap-4 text-[13px]" : "gap-3.5 text-xs")}>
          <button
            type="button"
            onClick={onLike}
            className={cn("flex items-center gap-1", reply.likedByMe && "text-danger")}
          >
            <Heart className={heartClass} />
            {reply.likeCount}
          </button>
          {onReply && (
            <button type="button" onClick={onReply} className="font-semibold">
              답글 달기
            </button>
          )}
          <button type="button" onClick={onMenu}>
            {mine ? "삭제" : "신고"}
          </button>
        </div>
      </div>
    </div>
  )
}
