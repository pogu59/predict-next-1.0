"use client"

import Link from "next/link"

import { Info } from "lucide-react"

import { useNow } from "@/lib/issues"
import { dailyProgress, formatPoints, splitMissions } from "@/lib/mission"
import { useMe } from "@/lib/queries/auth"
import { useMissions } from "@/lib/queries/mission"
import { useWallet } from "@/lib/queries/reward"
import { cn } from "@/lib/utils"
import {
  AttendanceCard,
  DailyBonusNote,
  DailySegments,
  MissionRow,
  PointCoin,
  PredictionBridge,
} from "@/components/mission-parts"

/**
 * 미션 탭. 오늘의 미션 → 출석 → 그 밖의 미션 → 예측 바로가기 순서.
 * PC는 2단(왼쪽 미션, 오른쪽 지갑·출석·예측), 모바일은 한 줄로 쌓는다.
 */
export default function MissionPage() {
  const now = useNow(60_000)
  const { data: me } = useMe()
  const { data: wallet } = useWallet()
  const { data: missions = [], isLoading, error } = useMissions()
  const { attendance, daily, others } = splitMissions(missions)
  const progress = dailyProgress(missions)
  const empty = !isLoading && !error && missions.length === 0

  const walletPill = me ? (
    <Link
      href="/my/wallet"
      aria-label={`지갑 열기, 보유 포인트 ${wallet ? formatPoints(wallet.balance) : ""}`}
      className="flex h-11 items-center gap-1.5 rounded-full bg-ink pr-3.5 pl-2.5 text-[15px] font-bold text-white tabular-nums"
    >
      <PointCoin />
      {wallet ? formatPoints(wallet.balance) : "지갑"}
    </Link>
  ) : (
    <Link
      href="/login"
      className="flex h-11 items-center rounded-full bg-surface px-4 text-sm font-bold"
    >
      로그인
    </Link>
  )

  return (
    <div className="flex flex-col gap-4 px-4 pt-2 pb-[100px] lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-7 lg:p-0">
      <div className="flex flex-col gap-4">
        <header className="flex h-12 items-center justify-between px-1 lg:h-auto lg:flex-col lg:items-start lg:gap-1.5 lg:pb-2">
          <h1 className="text-[26px] font-extrabold tracking-[-0.04em] lg:text-[28px]">
            미션
          </h1>
          <span className="hidden text-sm text-sub lg:block">
            미션에 참여하고 포인트를 모아 기프티콘으로 바꿔요
          </span>
          <span className="lg:hidden">{walletPill}</span>
        </header>

        {isLoading && <Skeleton className="h-[320px] rounded-[22px]" />}
        {error && (
          <div className="py-16 text-center text-sm text-faint">
            {error.message}
          </div>
        )}
        {empty && (
          <div className="flex flex-col items-center gap-2 rounded-[22px] bg-surface px-6 py-14 text-center">
            <span className="text-lg font-extrabold">
              지금 열린 미션이 없어요
            </span>
            <span className="text-sm text-sub">
              새 미션이 열리면 이 탭에서 바로 참여할 수 있어요.
            </span>
          </div>
        )}

        {daily.length > 0 && (
          <section
            aria-labelledby="daily-title"
            className="flex flex-col gap-1 rounded-[22px] bg-surface px-5 pt-5 pb-4"
          >
            <div className="flex items-baseline justify-between">
              <h2
                id="daily-title"
                className="text-[19px] font-extrabold tracking-[-0.03em]"
              >
                오늘의 미션
              </h2>
              <span className="text-sm font-extrabold tabular-nums">
                {progress.approved}/{progress.total}
              </span>
            </div>
            <DailySegments progress={progress} className="mt-2.5 mb-1.5" />
            {daily.map((m, i) => (
              <MissionRow
                key={m.id}
                mission={m}
                now={now}
                className={cn(i < daily.length - 1 && "border-b border-line-3")}
              />
            ))}
            <DailyBonusNote progress={progress} className="mt-2" />
          </section>
        )}

        {attendance && (
          <AttendanceCard mission={attendance} className="lg:hidden" />
        )}

        {others.length > 0 && (
          <section
            aria-labelledby="others-title"
            className="flex flex-col gap-2.5"
          >
            <div className="mx-1 mt-2 mb-0.5 flex flex-col gap-1">
              <h2
                id="others-title"
                className="text-[19px] font-extrabold tracking-[-0.03em]"
              >
                더 많은 미션
              </h2>
              <span className="text-[13px] font-medium text-sub">
                기간 안에 한 번씩 참여할 수 있어요
              </span>
            </div>
            {others.map((m) => (
              <MissionRow key={m.id} mission={m} now={now} variant="card" />
            ))}
          </section>
        )}

        <PredictionBridge className="lg:hidden" />
      </div>

      <aside className="hidden flex-col gap-3.5 lg:sticky lg:top-[92px] lg:flex">
        {me ? (
          <Link
            href="/my/wallet"
            className="flex flex-col gap-3 rounded-3xl bg-ink p-[22px] text-white"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-white/80">
              <PointCoin className="size-6" />내 포인트
            </span>
            <span className="text-[34px] leading-none font-extrabold tracking-[-0.045em] tabular-nums">
              {wallet ? formatPoints(wallet.balance) : "—"}
            </span>
            <span className="text-[13px] font-semibold text-white/75">
              지갑에서 기프티콘으로 바꿀 수 있어요
            </span>
          </Link>
        ) : (
          <div className="flex flex-col gap-3 rounded-3xl bg-surface p-[22px]">
            <span className="text-[15px] font-bold">
              로그인하면 미션 포인트를 모을 수 있어요
            </span>
            <Link
              href="/login"
              className="flex h-12 items-center justify-center rounded-[14px] bg-ink text-[15px] font-bold text-white"
            >
              로그인
            </Link>
          </div>
        )}
        <p className="flex gap-2 px-1 text-[13px] leading-normal font-medium text-sub">
          <Info className="mt-0.5 size-4 flex-none" />
          포인트는 미션으로 쌓이고 신용도와는 따로 관리돼요. 예측에는 쓸 수
          없어요.
        </p>
        {attendance && (
          <AttendanceCard mission={attendance} className="rounded-3xl" />
        )}
        <PredictionBridge className="rounded-3xl" />
      </aside>
    </div>
  )
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-line-3", className)} />
}
