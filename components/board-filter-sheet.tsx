"use client"

import { useState } from "react"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import type { PostPeriod } from "@/lib/api"
import { POST_PERIODS } from "@/lib/post-topics"
import { cn } from "@/lib/utils"

type Filters = { period: PostPeriod; hasImage: boolean }

/**
 * 게시판 상세 필터 — 기간, 사진 있는 글만. 모바일은 하단 바텀시트, PC(≥1024)는 중앙 400px 모달
 * (overlay.tsx ActionSheet와 같은 규칙). "적용"을 눌러야 반영된다.
 */
export function BoardFilterSheet({
  open,
  onOpenChange,
  period,
  hasImage,
  onApply,
}: Filters & {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApply: (next: Filters) => void
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-40 animate-fade-in bg-scrim" />
        <DialogPrimitive.Popup
          className={cn(
            "fixed inset-x-2 bottom-2 z-40 flex animate-sheet-up flex-col rounded-[28px] bg-surface px-5 pt-2.5 pb-5 outline-none",
            "lg:inset-x-auto lg:top-1/2 lg:bottom-auto lg:left-1/2 lg:w-[400px] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:animate-pop lg:rounded-3xl lg:p-6 lg:shadow-modal",
          )}
        >
          {/* 열 때마다 현재 값으로 초기화되도록 내용은 열린 동안만 그린다. */}
          {open && (
            <FilterBody
              initial={{ period, hasImage }}
              onApply={(next) => {
                onApply(next)
                onOpenChange(false)
              }}
            />
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function FilterBody({
  initial,
  onApply,
}: {
  initial: Filters
  onApply: (next: Filters) => void
}) {
  const [period, setPeriod] = useState(initial.period)
  const [hasImage, setHasImage] = useState(initial.hasImage)

  return (
    <>
      <div className="mb-2 h-1 w-9 self-center rounded-full bg-[#E0E0DD] lg:hidden" />
      <DialogPrimitive.Title className="pt-2 pb-4 text-[17px] font-extrabold lg:pt-0">
        필터
      </DialogPrimitive.Title>
      <span className="pb-2 text-[13px] font-semibold text-sub">기간</span>
      <div className="grid grid-cols-4 gap-1.5">
        {POST_PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            aria-pressed={period === p.key}
            onClick={() => setPeriod(p.key)}
            className={cn(
              "h-10 rounded-xl text-[13px] font-bold",
              period === p.key ? "bg-ink text-white" : "bg-track text-sub",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <label className="mt-5 flex items-center justify-between rounded-2xl bg-track px-4 py-3.5">
        <span className="text-[15px] font-semibold">사진 있는 글만</span>
        <input
          type="checkbox"
          checked={hasImage}
          onChange={(e) => setHasImage(e.target.checked)}
          className="size-5 accent-brand"
        />
      </label>
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setPeriod("all")
            setHasImage(false)
          }}
          className="h-[50px] flex-1 rounded-[14px] bg-track text-[15px] font-bold"
        >
          초기화
        </button>
        <button
          type="button"
          onClick={() => onApply({ period, hasImage })}
          className="h-[50px] flex-[2] rounded-[14px] bg-brand text-[15px] font-bold text-white"
        >
          적용
        </button>
      </div>
    </>
  )
}
