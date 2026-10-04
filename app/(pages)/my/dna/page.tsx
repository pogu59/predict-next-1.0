"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { ChevronRight, ImageDown, Lightbulb } from "lucide-react"

import { useCredit } from "@/lib/credit"
import {
  ARCHETYPES,
  predictionDna,
  type ArchetypeKey,
  type PredictionDna,
} from "@/lib/insights"
import { useMe } from "@/lib/queries/auth"
import { renderShareCard, shareOrDownload } from "@/lib/share-card"
import { cn } from "@/lib/utils"
import { SubHeader } from "@/components/sub-header"
import { useToast } from "@/components/ui/toast"

/** 성향 지도 2×2 — 좌상 대세 승부사, 우상 역발상 승부사, 좌하 신중한 분석가, 우하 조용한 저격수. */
const QUADRANTS: ArchetypeKey[] = [
  "majority-bold",
  "contrarian-bold",
  "majority-calm",
  "contrarian-calm",
]
const STAKE_AXIS_MAX = 300

/** 기준선(소수 선택 40%)이 가운데 오도록 구간별로 늘린다: 0~40 → 0~50%, 40~100 → 50~100%. */
function minorityToX(rate: number) {
  return rate <= 40 ? (rate / 40) * 50 : 50 + ((rate - 40) / 60) * 50
}

export default function DnaPage() {
  const router = useRouter()
  const { isLoading: meLoading } = useMe()
  const { me, votes, credit } = useCredit()

  useEffect(() => {
    if (!meLoading && !me) router.replace("/login")
  }, [meLoading, me, router])

  if (!me) return null

  const dna = predictionDna(votes)
  const archetype = ARCHETYPES[dna.archetype]

  return (
    <div className="pb-10 lg:pb-0">
      <SubHeader title="내 예측 성향" fallback="/my" />
      <h1 className="hidden pb-[18px] text-[30px] font-extrabold tracking-[-0.04em] lg:block">
        내 예측 성향
      </h1>
      <div className="flex flex-col gap-4 px-4 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-7 lg:px-0">
        <div className="flex flex-col gap-4">
          <section className="flex flex-col gap-2 rounded-3xl bg-brand p-6 text-white lg:p-8">
            <span className="text-[15px] font-semibold opacity-80">
              {me.nickname}님은
            </span>
            <span className="text-[34px] leading-[1.2] font-extrabold tracking-[-0.04em] lg:text-[44px]">
              {archetype.name}
            </span>
            <span className="text-[15px] leading-[1.6] opacity-90">
              {archetype.summary}
            </span>
            <span className="pt-1 text-xs font-semibold opacity-70">
              예측 {dna.total}개 기준
            </span>
          </section>
          <DnaMap dna={dna} />
          <section className="flex flex-col gap-2 rounded-3xl bg-surface p-5">
            <span className="flex items-center gap-2 text-base font-extrabold">
              <Lightbulb className="size-[18px] text-warn-ink" />
              전략 팁
            </span>
            <span className="text-sm leading-[1.6] text-ink-2">
              {archetype.tip}
            </span>
            <Link
              href="/guide"
              className="flex items-center gap-0.5 self-start pt-1 text-[13px] font-bold text-brand"
            >
              점수 계산법 보기
              <ChevronRight className="size-4" />
            </Link>
          </section>
        </div>
        <aside className="flex flex-col gap-4 lg:sticky lg:top-[92px]">
          <DnaStats dna={dna} />
          <RecentForm form={dna.recentForm} />
          <ShareButton
            nickname={me.nickname}
            tier={me.tier}
            credit={credit}
            dna={dna}
          />
        </aside>
      </div>
    </div>
  )
}

function DnaMap({ dna }: { dna: PredictionDna }) {
  const rookie = dna.archetype === "rookie"
  const x = minorityToX(dna.minorityRate)
  const y =
    100 - (Math.min(dna.averageStake, STAKE_AXIS_MAX) / STAKE_AXIS_MAX) * 100
  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-base font-extrabold">성향 지도</span>
        <span className="text-xs font-semibold text-muted tabular-nums">
          소수 선택 {dna.minorityRate}% · 평균 {dna.averageStake} 걸기
        </span>
      </div>
      <span className="text-xs font-semibold text-muted">크게 건다 ↑</span>
      <div className="relative grid aspect-[4/3] grid-cols-2 grid-rows-2 gap-1.5">
        {QUADRANTS.map((key) => (
          <div
            key={key}
            className={cn(
              "grid place-items-center rounded-2xl text-sm font-bold",
              !rookie && key === dna.archetype
                ? "bg-brand-soft text-brand"
                : "bg-track text-faint",
            )}
          >
            {ARCHETYPES[key].name}
          </div>
        ))}
        {!rookie && (
          <span
            className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-brand shadow-[0_2px_6px_rgba(0,0,0,.2)]"
            style={{ left: `${x}%`, top: `${y}%` }}
            aria-label={`내 위치: 소수 선택 ${dna.minorityRate}%, 평균 ${dna.averageStake} 걸기`}
          />
        )}
      </div>
      <span className="self-end text-xs font-semibold text-muted">
        소수 의견을 자주 고른다 →
      </span>
    </section>
  )
}

function DnaStats({ dna }: { dna: PredictionDna }) {
  const tiles = [
    {
      label: "적중률",
      value: dna.accuracy == null ? "-" : `${dna.accuracy}%`,
      sub: `${dna.correct} / ${dna.graded} 적중`,
    },
    {
      label: "소수 의견 선택",
      value: `${dna.minorityRate}%`,
      sub: `적중 ${dna.minorityHits}회`,
    },
    {
      label: "연속 적중",
      value: `${dna.currentStreak}`,
      sub: `최고 ${dna.bestStreak}연속`,
    },
    {
      label: "최고 수익",
      value: dna.bestHit ? `+${dna.bestHit.delta}` : "-",
      sub: dna.bestHit ? `비율 ${dna.bestHit.pct}% 쪽 적중` : "아직 없어요",
      href: dna.bestHit ? `/issue/${dna.bestHit.issueId}` : undefined,
    },
  ]
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {tiles.map((t) => {
        const body = (
          <>
            <span className="text-xs font-semibold text-muted">{t.label}</span>
            <span className="text-[26px] leading-tight font-extrabold tabular-nums">
              {t.value}
            </span>
            <span className="text-xs font-semibold text-sub">{t.sub}</span>
          </>
        )
        const className = "flex flex-col gap-1 rounded-[22px] bg-surface p-4"
        return t.href ? (
          <Link key={t.label} href={t.href} className={className}>
            {body}
          </Link>
        ) : (
          <div key={t.label} className={className}>
            {body}
          </div>
        )
      })}
    </div>
  )
}

function RecentForm({ form }: { form: ("W" | "L")[] }) {
  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-surface p-5">
      <span className="text-base font-extrabold">최근 결과</span>
      {form.length === 0 ? (
        <span className="text-sm text-muted">
          결과가 나온 예측이 아직 없어요
        </span>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {form.map((f, i) => (
            <span
              key={i}
              className={cn(
                "grid size-8 place-items-center rounded-full text-xs font-bold",
                f === "W" ? "bg-brand text-white" : "bg-track text-muted",
              )}
            >
              {f === "W" ? "적" : "빗"}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}

function ShareButton(props: {
  nickname: string
  tier: string
  credit: number
  dna: PredictionDna
}) {
  const showToast = useToast()
  const [busy, setBusy] = useState(false)
  const rookie = props.dna.archetype === "rookie"

  async function share() {
    setBusy(true)
    try {
      const blob = await renderShareCard(props)
      const result = await shareOrDownload(blob, "predict-dna.png")
      if (result === "saved") showToast("공유 카드를 저장했어요")
    } catch {
      showToast("공유 카드를 만들지 못했어요")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={share}
        disabled={rookie || busy}
        className="flex h-[54px] items-center justify-center gap-2 rounded-2xl bg-ink text-[15px] font-bold text-white disabled:bg-disabled-bg disabled:text-muted"
      >
        <ImageDown className="size-5" />
        공유 카드 만들기
      </button>
      {rookie && (
        <span className="text-center text-xs font-semibold text-muted">
          예측 3개부터 공유 카드를 만들 수 있어요
        </span>
      )}
    </div>
  )
}
