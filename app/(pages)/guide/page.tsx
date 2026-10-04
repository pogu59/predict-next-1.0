"use client"

import Link from "next/link"
import { useState } from "react"

import { Banknote, EyeOff, Repeat, Undo2, type LucideIcon } from "lucide-react"

import { payout } from "@/lib/issues"
import { useMe } from "@/lib/queries/auth"
import { TIER_THRESHOLDS, TierIcon, tierLabel } from "@/lib/tier"
import { cn } from "@/lib/utils"
import { SubHeader } from "@/components/sub-header"

const OPTION_COUNTS = [2, 3, 4, 5, 6]
const PCT_PRESETS = [
  { label: "소수", pct: 20 },
  { label: "접전", pct: 50 },
  { label: "대세", pct: 80 },
]
const STAKES = [50, 100, 200, 500]

const RULES: { Icon: LucideIcon; title: string; body: string }[] = [
  {
    Icon: Banknote,
    title: "돈은 걸지 않아요",
    body: "신용도는 순위와 티어 표시용이에요. 현금이나 아이템으로 바꿀 수 없어요.",
  },
  {
    Icon: Repeat,
    title: "마감 전엔 마음을 바꿀 수 있어요",
    body: "선택만 바뀌고 걸어둔 신용도는 그대로예요.",
  },
  {
    Icon: EyeOff,
    title: "참여 인원은 비공개예요",
    body: "몇 명이 골랐는지 대신 비율만 보여드려요.",
  },
  {
    Icon: Undo2,
    title: "이슈가 취소되면 전액 돌려드려요",
    body: "걸었던 신용도가 그대로 돌아와요.",
  },
]

/** 마스터 → 브론즈 순. 언랭크는 사다리에서 뺀다. */
const LADDER = (Object.entries(TIER_THRESHOLDS) as [string, number][])
  .filter(([tier]) => tier !== "UNRANKED")
  .reverse()

function Segment<T extends number>({
  values,
  value,
  onChange,
  label,
}: {
  values: T[]
  value: T
  onChange: (v: T) => void
  label: (v: T) => string
}) {
  return (
    <div className="flex gap-1.5">
      {values.map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={v === value}
          onClick={() => onChange(v)}
          className={cn(
            "h-10 flex-1 rounded-xl text-sm font-bold tabular-nums",
            v === value ? "bg-ink text-white" : "bg-track text-ink",
          )}
        >
          {label(v)}
        </button>
      ))}
    </div>
  )
}

export default function GuidePage() {
  const { data: me, isLoading } = useMe()
  const [optionCount, setOptionCount] = useState(2)
  const [pct, setPct] = useState(20)
  const [stake, setStake] = useState(100)
  const { win, lose } = payout(pct, optionCount, stake)

  return (
    <div className="pb-10 lg:pb-0">
      <SubHeader title="점수 가이드" fallback="/" />
      <div className="flex flex-col gap-1.5 px-5 pt-2 pb-5 lg:px-0 lg:pt-0">
        <h1 className="text-2xl font-extrabold tracking-[-0.04em] lg:text-[30px]">
          점수는 이렇게 움직여요
        </h1>
        <span className="text-sm leading-[1.6] text-sub lg:text-[15px]">
          남들이 덜 고른 쪽을 맞힐수록 크게 오르고, 다들 고른 쪽에서 빗나가면
          크게 잃어요.
        </span>
      </div>

      <div className="flex flex-col gap-4 px-4 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-7 lg:px-0">
        <section className="flex flex-col gap-5 rounded-3xl bg-surface p-5 lg:p-7">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold">선택지 수</span>
            <Segment
              values={OPTION_COUNTS}
              value={optionCount}
              onChange={setOptionCount}
              label={(n) => `${n}지선다`}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <label htmlFor="guide-pct" className="text-sm font-bold">
                내가 고른 쪽의 비율
              </label>
              <span className="text-[28px] font-extrabold text-brand tabular-nums">
                {pct}%
              </span>
            </div>
            <input
              id="guide-pct"
              type="range"
              min={1}
              max={99}
              value={pct}
              onChange={(e) => setPct(Number(e.target.value))}
              className="w-full accent-brand"
            />
            <div className="flex gap-1.5">
              {PCT_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  aria-pressed={pct === p.pct}
                  onClick={() => setPct(p.pct)}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-[13px] font-bold",
                    pct === p.pct ? "bg-ink text-white" : "bg-track text-ink",
                  )}
                >
                  {p.label} {p.pct}%
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold">걸 신용도</span>
            <Segment
              values={STAKES}
              value={stake}
              onChange={setStake}
              label={(n) => String(n)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5" aria-live="polite">
            <div className="flex flex-col gap-1 rounded-[18px] bg-brand-soft p-4">
              <span className="text-[13px] font-semibold text-brand">
                맞히면
              </span>
              <span className="text-[28px] font-extrabold text-brand tabular-nums">
                +{win}
              </span>
              <span className="text-xs font-semibold text-sub tabular-nums">
                {stake + win} 돌려받아요
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-[18px] bg-track p-4">
              <span className="text-[13px] font-semibold text-sub">
                빗나가면
              </span>
              <span className="text-[28px] font-extrabold tabular-nums">
                -{lose}
              </span>
              <span className="text-xs font-semibold text-sub tabular-nums">
                {stake - lose} 돌려받아요
              </span>
            </div>
          </div>

          <PayoutChart pct={pct} optionCount={optionCount} stake={stake} />

          <span className="text-xs leading-[1.6] text-muted">
            실제 정산은 마감 시점의 비율로 계산해서, 투표할 때 본 예상값과 조금
            다를 수 있어요. 비율이 비슷한 접전일수록 작은 보너스가 더 붙어요.
          </span>
        </section>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-[92px]">
          <section className="flex flex-col gap-1 rounded-3xl bg-surface p-5">
            <span className="pb-2 text-base font-extrabold">티어 사다리</span>
            {LADDER.map(([tier, at]) => {
              const mine = me?.tier === tier
              return (
                <div
                  key={tier}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-2.5 py-2",
                    mine && "bg-brand-soft",
                  )}
                >
                  <TierIcon tier={tier} size={22} />
                  <span
                    className={cn(
                      "flex-1 text-sm font-bold",
                      mine && "text-brand",
                    )}
                  >
                    {tierLabel(tier)}
                    {mine && " · 지금 여기"}
                  </span>
                  <span className="text-[13px] font-semibold text-muted tabular-nums">
                    {tier === "BRONZE"
                      ? "1 이상"
                      : `${at.toLocaleString()}부터`}
                  </span>
                </div>
              )
            })}
            <span className="pt-2 text-xs leading-[1.6] text-muted">
              가입하면 500으로 골드에서 시작해요. 예측에 걸어둔 신용도도
              합산해요.
            </span>
          </section>

          <section className="flex flex-col gap-4 rounded-3xl bg-surface p-5">
            {RULES.map(({ Icon, title, body }) => (
              <div key={title} className="flex gap-3">
                <Icon className="mt-0.5 size-5 flex-none text-brand" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold">{title}</span>
                  <span className="text-[13px] leading-[1.6] text-sub">
                    {body}
                  </span>
                </div>
              </div>
            ))}
          </section>

          {!isLoading && !me && (
            <Link
              href="/login"
              className="flex h-[54px] items-center justify-center rounded-2xl bg-brand text-[15px] font-bold text-white"
            >
              500으로 시작하기
            </Link>
          )}
        </aside>
      </div>
    </div>
  )
}

const CHART = { w: 320, h: 150, left: 8, right: 8, top: 10, bottom: 22 }

/** 비율 1~99%에서 맞히면 얻는 점수(보라)와 빗나가면 잃는 점수(회색). */
function PayoutChart({
  pct,
  optionCount,
  stake,
}: {
  pct: number
  optionCount: number
  stake: number
}) {
  const points = Array.from({ length: 99 }, (_, i) => ({
    p: i + 1,
    ...payout(i + 1, optionCount, stake),
  }))
  const max = Math.max(1, ...points.map((pt) => Math.max(pt.win, pt.lose)))
  const plotW = CHART.w - CHART.left - CHART.right
  const plotH = CHART.h - CHART.top - CHART.bottom
  const x = (p: number) => CHART.left + ((p - 1) / 98) * plotW
  const y = (v: number) => CHART.top + plotH - (v / max) * plotH
  const line = (key: "win" | "lose") =>
    points
      .map((pt) => `${x(pt.p).toFixed(1)},${y(pt[key]).toFixed(1)}`)
      .join(" ")
  const current = payout(pct, optionCount, stake)

  return (
    <figure className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${CHART.w} ${CHART.h}`}
        className="w-full"
        role="img"
        aria-label={`비율 ${pct}%에서 맞히면 +${current.win}, 빗나가면 -${current.lose}`}
      >
        <line
          x1={CHART.left}
          x2={CHART.w - CHART.right}
          y1={CHART.top + plotH}
          y2={CHART.top + plotH}
          className="stroke-line"
        />
        <polyline
          points={line("lose")}
          fill="none"
          className="stroke-muted"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        <polyline
          points={line("win")}
          fill="none"
          className="stroke-brand"
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <line
          x1={x(pct)}
          x2={x(pct)}
          y1={CHART.top}
          y2={CHART.top + plotH}
          className="stroke-faint"
          strokeDasharray="4 4"
        />
        <circle
          cx={x(pct)}
          cy={y(current.win)}
          r={5}
          className="fill-brand stroke-white"
          strokeWidth={2}
        />
        <circle
          cx={x(pct)}
          cy={y(current.lose)}
          r={5}
          className="fill-muted stroke-white"
          strokeWidth={2}
        />
        <text
          x={CHART.left}
          y={CHART.h - 4}
          className="fill-muted text-[10px] font-semibold"
        >
          소수 1%
        </text>
        <text
          x={CHART.w - CHART.right}
          y={CHART.h - 4}
          textAnchor="end"
          className="fill-muted text-[10px] font-semibold"
        >
          대세 99%
        </text>
      </svg>
      <figcaption className="flex gap-4 text-xs font-semibold text-sub">
        <span className="flex items-center gap-1.5">
          <span className="h-[3px] w-4 rounded-full bg-brand" />
          얻는 점수
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-[3px] w-4 rounded-full bg-muted" />
          잃는 점수
        </span>
      </figcaption>
    </figure>
  )
}
