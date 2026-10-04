"use client"

import Link from "next/link"

import { ChevronRight, Sparkles } from "lucide-react"

import { useNow } from "@/lib/issues"
import { cn } from "@/lib/utils"
import { isWrappedSeason } from "@/lib/wrapped"

/** 결산 기간(2026-12-15 ~ 2027-01-31, 한국시간)에만 보이는 "내 촉 결산" 배너 → /wrapped */
export function WrappedBanner({ className }: { className?: string }) {
  const now = useNow(60_000)
  if (!isWrappedSeason(now)) return null
  return (
    <Link
      href="/wrapped"
      className={cn(
        "flex items-center gap-3 rounded-[18px] bg-brand px-4 py-3.5 text-white",
        className,
      )}
    >
      <Sparkles className="size-5 flex-none" />
      <span className="flex-1 text-sm font-bold">
        2026 내 촉 결산이 도착했어요
      </span>
      <ChevronRight className="size-[18px] opacity-80" />
    </Link>
  )
}
