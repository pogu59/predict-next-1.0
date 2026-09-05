"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const cancelButtonClass =
  "rounded-lg border border-line-strong bg-control px-4 py-2.5 text-label text-ink-muted transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-50"

const confirmButtonClass = {
  default:
    "rounded-lg bg-accent px-4 py-2.5 text-label text-accent-ink transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50",
  destructive:
    "rounded-lg bg-accent-deep px-4 py-2.5 text-label text-accent-ink transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50",
}

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive"
  loading?: boolean
  error?: string | null
  onConfirm: () => void
}

/** 되돌리기 어려운 동작(투표, 로그아웃, 관리자 확정 등) 전에 공통으로 쓰는 확인 다이얼로그. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  variant = "default",
  loading = false,
  error,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (loading) return
        onOpenChange(next)
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-wrong bg-wrong-chip px-4 py-2.5 text-caption text-[#D6DEEC]">
            {error}
          </div>
        )}

        <DialogFooter>
          <button
            type="button"
            className={cancelButtonClass}
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={cn(confirmButtonClass[variant])}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "처리 중..." : confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
