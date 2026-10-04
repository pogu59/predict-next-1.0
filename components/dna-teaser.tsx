import Link from "next/link"

import { ChevronRight, FingerprintPattern } from "lucide-react"

import type { MyVote } from "@/lib/api"
import { ARCHETYPES, predictionDna } from "@/lib/insights"
import { cn } from "@/lib/utils"

/** 마이페이지 한 줄 카드 — 내 예측 성향 유형(또는 안내)과 연속 적중 칩, /my/dna 로 이동. */
export function DnaTeaser({
  votes,
  className,
}: {
  votes: MyVote[]
  className?: string
}) {
  const dna = predictionDna(votes)
  const rookie = dna.archetype === "rookie"
  return (
    <Link
      href="/my/dna"
      className={cn("flex items-center gap-3 bg-surface", className)}
    >
      <span className="grid size-10 flex-none place-items-center rounded-xl bg-brand-soft text-brand">
        <FingerprintPattern className="size-5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-xs font-semibold text-muted">내 예측 성향</span>
        <span className="truncate text-[15px] font-bold">
          {rookie ? "예측 3개부터 알려드려요" : ARCHETYPES[dna.archetype].name}
        </span>
      </div>
      {dna.currentStreak >= 2 && (
        <span className="flex-none rounded-[7px] bg-brand-soft px-2 py-[5px] text-xs font-bold text-brand tabular-nums">
          {dna.currentStreak}연속 적중
        </span>
      )}
      <ChevronRight className="size-[18px] flex-none text-disabled-ink" />
    </Link>
  )
}
