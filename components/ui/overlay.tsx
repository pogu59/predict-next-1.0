"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import type { ReportReason } from "@/lib/api"
import { cn } from "@/lib/utils"

export type SheetItem = {
  label: string
  danger?: boolean
  onSelect: () => void
}

type ActionSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  items: SheetItem[]
}

/**
 * 메뉴 시트 — 모바일은 하단 바텀시트, PC(≥1024)는 중앙 380px 모달로 같은 API를 쓴다.
 */
export function ActionSheet({ open, onOpenChange, title, items }: ActionSheetProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-40 animate-fade-in bg-scrim" />
        <DialogPrimitive.Popup
          className={cn(
            "fixed inset-x-2 bottom-2 z-40 flex animate-sheet-up flex-col rounded-[28px] bg-surface px-2 pt-2.5 pb-2 outline-none",
            "lg:inset-x-auto lg:top-1/2 lg:bottom-auto lg:left-1/2 lg:w-[380px] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:animate-pop lg:rounded-3xl lg:p-3 lg:shadow-modal",
          )}
        >
          <div className="mb-2 h-1 w-9 self-center rounded-full bg-[#E0E0DD] lg:hidden" />
          {title ? (
            <DialogPrimitive.Title className="px-4 pt-2 pb-2.5 text-[17px] font-extrabold lg:px-3.5 lg:pt-2.5 lg:pb-2">
              {title}
            </DialogPrimitive.Title>
          ) : (
            <DialogPrimitive.Title className="sr-only">메뉴</DialogPrimitive.Title>
          )}
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onSelect}
              className={cn(
                "rounded-[14px] p-4 text-left text-base font-semibold hover:bg-bg lg:rounded-xl lg:p-3.5 lg:text-[15px]",
                item.danger ? "text-danger" : "text-ink",
              )}
            >
              {item.label}
            </button>
          ))}
          <DialogPrimitive.Close className="mt-1 rounded-2xl bg-track p-4 text-center text-base font-bold lg:rounded-[14px] lg:p-3.5 lg:text-[15px]">
            취소
          </DialogPrimitive.Close>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export const REPORT_REASONS: ReportReason[] = [
  "스팸·광고",
  "욕설·비하",
  "음란·선정성",
  "개인정보 노출",
  "기타",
]

/** 신고 사유 시트. 고르면 onSelect(reason)을 부르고 닫힌다. */
export function ReportSheet({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (reason: ReportReason) => void
}) {
  return (
    <ActionSheet
      open={open}
      onOpenChange={onOpenChange}
      title="신고 사유를 선택해 주세요"
      items={REPORT_REASONS.map((reason) => ({
        label: reason,
        onSelect: () => {
          onOpenChange(false)
          onSelect(reason)
        },
      }))}
    />
  )
}

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  confirmLabel: string
  loading?: boolean
  onConfirm: () => void
}

/** 삭제·로그아웃처럼 되돌리기 어려운 동작 전에 쓰는 확인 모달. 취소 #F3F3F1 / 확인 danger. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 animate-fade-in bg-[rgb(17_17_19/0.45)]" />
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-7 lg:p-0">
          <DialogPrimitive.Popup className="pointer-events-auto flex w-full animate-pop flex-col gap-2 rounded-3xl bg-surface px-5 pt-6 pb-4 outline-none lg:w-[400px] lg:px-6 lg:pt-[26px] lg:pb-[18px]">
            <DialogPrimitive.Title className="text-lg font-extrabold tracking-[-0.02em] lg:text-[19px]">
              {title}
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className="text-sm leading-[1.6] text-sub">
                {description}
              </DialogPrimitive.Description>
            )}
            <div className="mt-3.5 flex gap-2">
              <DialogPrimitive.Close
                disabled={loading}
                className="h-[50px] flex-1 rounded-[14px] bg-track text-[15px] font-bold text-ink"
              >
                취소
              </DialogPrimitive.Close>
              <button
                type="button"
                disabled={loading}
                onClick={onConfirm}
                className="h-[50px] flex-1 rounded-[14px] bg-danger text-[15px] font-bold text-white disabled:opacity-60"
              >
                {confirmLabel}
              </button>
            </div>
          </DialogPrimitive.Popup>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
