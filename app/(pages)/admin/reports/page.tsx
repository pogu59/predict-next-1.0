"use client"

import { CircleCheck, FileText, Flag, MessageCircle, Trash2, Undo2 } from "lucide-react"
import { useState } from "react"

import type { AdminReport } from "@/lib/api"
import { timeAgo, useNow } from "@/lib/issues"
import { useAdminReports, useRejectReport, useRemoveReportedContent } from "@/lib/queries/admin"
import { useAdminUI } from "@/components/admin/admin-ui"
import { EmptyState, SegTabs } from "@/components/admin/parts"
import { useToast } from "@/components/ui/toast"

type ReportFilter = "PENDING" | "DONE"

export default function AdminReportsPage() {
  const [filter, setFilter] = useState<ReportFilter>("PENDING")
  const now = useNow(60_000)
  const pending = useAdminReports("PENDING")
  const done = useAdminReports("DONE")
  const current = filter === "PENDING" ? pending : done
  const reports = current.data ?? []

  return (
    <>
      <SegTabs
        className="self-start"
        tabs={[
          { key: "PENDING", label: "미처리", count: pending.data?.length ?? 0 },
          { key: "DONE", label: "처리 완료", count: done.data?.length ?? 0 },
        ]}
        value={filter}
        onChange={setFilter}
      />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-3.5">
        {reports.map((r) => (
          <ReportCard key={r.id} report={r} now={now} />
        ))}
      </div>
      {reports.length === 0 && (
        <EmptyState text={current.isLoading ? "불러오는 중..." : "처리할 신고가 없어요"} />
      )}
    </>
  )
}

function ReportCard({ report: r, now }: { report: AdminReport; now: Date }) {
  const ui = useAdminUI()
  const showToast = useToast()
  const reject = useRejectReport()
  const removeContent = useRemoveReportedContent()
  const type = r.kind === "post" ? "게시글" : "댓글"
  const Icon = r.kind === "post" ? FileText : MessageCircle

  return (
    <div className="flex flex-col gap-3.5 rounded-[22px] bg-surface p-5">
      <div className="flex items-center gap-1.5">
        <span className="flex items-center gap-1 rounded-[7px] bg-track px-2 py-1 text-xs font-bold text-sub">
          <Icon className="size-[13px]" />
          {type}
        </span>
        <span className="rounded-[7px] bg-danger-soft px-2 py-1 text-xs font-bold text-danger-ink">{r.reason}</span>
        <span className="flex-1" />
        <span className="text-xs text-muted">{timeAgo(r.createdAt, now)}</span>
      </div>
      <div className="flex flex-col gap-1.5 rounded-[14px] bg-bg px-4 py-3.5">
        <span className="text-xs font-semibold text-muted">
          {r.authorNickname}님의 {type}
        </span>
        <span className="text-sm leading-[1.6]">{r.excerpt}</span>
      </div>
      <span className="flex items-center gap-1 text-xs text-muted">
        <Flag className="size-[13px]" />
        신고 {r.count}건 누적
      </span>
      {r.status === "PENDING" ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              reject.mutate(r.id, {
                onSuccess: () => showToast("신고를 반려했어요"),
                onError: (e) => showToast(e.message),
              })
            }
            className="flex h-10 flex-1 items-center justify-center gap-[5px] rounded-xl border-[1.5px] border-line-2 bg-surface text-[13px] font-bold text-ink"
          >
            <Undo2 className="size-[15px]" />
            반려
          </button>
          <button
            type="button"
            onClick={() =>
              ui.askGeneric({
                title: "신고된 콘텐츠를 삭제할까요?",
                description: `${r.authorNickname}님의 ${type}이 삭제되고 신고가 처리 완료로 바뀌어요.`,
                okLabel: "삭제",
                onOk: async () => {
                  await removeContent.mutateAsync(r.id)
                  showToast("콘텐츠를 삭제했어요")
                },
              })
            }
            className="flex h-10 flex-1 items-center justify-center gap-[5px] rounded-xl bg-danger text-[13px] font-bold text-white"
          >
            <Trash2 className="size-[15px]" />
            콘텐츠 삭제
          </button>
        </div>
      ) : (
        <span className="flex items-center gap-1.5 text-[13px] font-bold text-sub">
          <CircleCheck className="size-[17px] text-success" />
          {r.status === "REMOVED" ? "콘텐츠 삭제됨" : "반려됨"}
        </span>
      )}
    </div>
  )
}
