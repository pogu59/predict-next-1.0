"use client"

import { useCredit } from "@/lib/credit"
import { TierIcon, tierLabel } from "@/lib/tier"
import { cn } from "@/lib/utils"

/**
 * brand 배경 신용도 카드. 큰 숫자 = 보유(에스크로 제외), 진행바·보조 문구 = 에스크로 포함 총액 기준.
 * header: "label"은 "내 신용도" 라벨(마이), "profile"은 티어 아이콘 + 닉네임 · 티어(PC 홈 사이드).
 */
export function CreditCard({ header, className }: { header: "label" | "profile"; className?: string }) {
  const { me, credit, progress, nextLabel } = useCredit()
  if (!me) return null
  return (
    <div className={cn("flex flex-col gap-3 bg-brand text-white", className)}>
      {header === "label" ? (
        <span className="text-[13px] font-semibold opacity-75">내 신용도</span>
      ) : (
        <div className="flex items-center gap-2">
          <TierIcon tier={me.tier} size={22} />
          <span className="text-sm font-bold">
            {me.nickname} · {tierLabel(me.tier)}
          </span>
        </div>
      )}
      <span className="text-[36px] leading-none font-extrabold tracking-[-0.045em] tabular-nums lg:text-[38px]">
        {credit.toLocaleString()}
      </span>
      <div className="h-1.5 overflow-hidden rounded-[3px] bg-white/25">
        <div className="h-full rounded-[3px] bg-white" style={{ width: `${progress.percent}%` }} />
      </div>
      <span className="text-xs font-semibold opacity-80">{nextLabel}</span>
    </div>
  )
}
