"use client"

import { Eye, EyeOff, FileText, Flag, Heart, MessageCircle, Trash2 } from "lucide-react"
import { useState } from "react"

import type { AdminCommunityItem, CommunityContentType } from "@/lib/api"
import { timeAgo, useNow } from "@/lib/issues"
import { useAdminCommunity, useDeleteCommunityContent, useSetCommunityHidden } from "@/lib/queries/admin"
import { cn } from "@/lib/utils"
import { useAdminUI } from "@/components/admin/admin-ui"
import { SegTabs } from "@/components/admin/parts"
import { useToast } from "@/components/ui/toast"

export default function AdminCommunityPage() {
  const [type, setType] = useState<CommunityContentType>("posts")
  const now = useNow(60_000)
  const posts = useAdminCommunity("posts")
  const comments = useAdminCommunity("comments")
  const current = type === "posts" ? posts : comments

  // 신고 많은 순 → 최신순
  const rows = [...(current.data ?? [])].sort(
    (a, b) => b.reportCount - a.reportCount || Date.parse(b.createdAt) - Date.parse(a.createdAt),
  )

  return (
    <>
      <SegTabs
        className="self-start"
        tabs={[
          { key: "posts", label: "게시글", count: posts.data?.length ?? 0 },
          { key: "comments", label: "댓글", count: comments.data?.length ?? 0 },
        ]}
        value={type}
        onChange={setType}
      />
      <div className="rounded-[22px] bg-surface px-[22px] py-1.5">
        {rows.map((row) => (
          <CommunityRow key={row.id} type={type} row={row} now={now} />
        ))}
        {rows.length === 0 && (
          <div className="py-10 text-center text-sm text-faint">
            {current.error ? current.error.message : current.isLoading ? "불러오는 중..." : "항목이 없어요"}
          </div>
        )}
      </div>
    </>
  )
}

function CommunityRow({ type, row, now }: { type: CommunityContentType; row: AdminCommunityItem; now: Date }) {
  const ui = useAdminUI()
  const showToast = useToast()
  const setHidden = useSetCommunityHidden()
  const remove = useDeleteCommunityContent()
  const Icon = type === "posts" ? FileText : MessageCircle
  const meta =
    type === "posts"
      ? `${row.authorNickname} · ${timeAgo(row.createdAt, now)} · 댓글 ${row.replyCount ?? 0}`
      : `${row.authorNickname} · ${timeAgo(row.createdAt, now)}${row.where ? ` · ${row.where}` : ""}`

  return (
    <div className={cn("flex items-center gap-3.5 border-b border-line-3 py-4 last:border-b-0", row.hidden && "opacity-55")}>
      <span className="grid size-10 flex-none place-items-center rounded-xl bg-track text-sub">
        <Icon className="size-[18px]" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
        <div className="flex items-center gap-2">
          <span className="truncate text-[15px] font-bold">{row.title}</span>
          {row.reportCount > 0 && (
            <span className="flex flex-none items-center gap-[3px] rounded-md bg-danger-soft px-[7px] py-[3px] text-[11px] font-bold text-danger-ink">
              <Flag className="size-[11px]" />
              신고 {row.reportCount}
            </span>
          )}
          {row.hidden && (
            <span className="flex-none rounded-md bg-line-3 px-[7px] py-[3px] text-[11px] font-bold text-sub">숨김</span>
          )}
        </div>
        <span className="flex items-center gap-2.5 text-xs text-muted">
          <span>{meta}</span>
          <span className="flex items-center gap-[3px]">
            <Heart className="size-3" />
            {row.likeCount}
          </span>
        </span>
      </div>
      <button
        type="button"
        onClick={() =>
          setHidden.mutate(
            { type, id: row.id, hidden: !row.hidden },
            {
              onSuccess: () => showToast(row.hidden ? "다시 공개했어요" : "사용자에게 숨겼어요"),
              onError: (e) => showToast(e.message),
            },
          )
        }
        className="flex h-[34px] items-center gap-1 rounded-[10px] border-[1.5px] border-line-2 bg-surface px-[11px] text-xs font-bold text-ink"
      >
        {row.hidden ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
        {row.hidden ? "숨김 해제" : "숨기기"}
      </button>
      <button
        type="button"
        onClick={() =>
          ui.askGeneric({
            title: type === "posts" ? "게시글을 삭제할까요?" : "댓글을 삭제할까요?",
            description: "삭제하면 복구할 수 없어요.",
            okLabel: "삭제",
            onOk: async () => {
              await remove.mutateAsync({ type, id: row.id })
              showToast("삭제했어요")
            },
          })
        }
        className="flex h-[34px] items-center gap-1 rounded-[10px] bg-danger-soft px-[11px] text-xs font-bold text-danger-ink"
      >
        <Trash2 className="size-3.5" />
        삭제
      </button>
    </div>
  )
}
