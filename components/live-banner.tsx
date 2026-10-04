"use client"

import Link from "next/link"

import { ChevronRight } from "lucide-react"

import { useLiveCount } from "@/lib/queries/issue"
import { cn } from "@/lib/utils"

/** 열린 라이브가 있을 때만 보이는 모바일 배너 → /live */
export function LiveBanner({ className }: { className?: string }) {
  const count = useLiveCount()
  if (count === 0) return null
  return (
    <Link
      href="/live"
      className={cn(
        "flex items-center gap-2.5 rounded-[18px] bg-ink px-4 py-3.5 text-white lg:hidden",
        className,
      )}
    >
      <span className="size-2 animate-pulse rounded-full bg-danger" />
      <span className="flex-1 text-sm font-bold tabular-nums">
        지금 라이브 {count}개 진행 중
      </span>
      <ChevronRight className="size-[18px] opacity-70" />
    </Link>
  )
}
