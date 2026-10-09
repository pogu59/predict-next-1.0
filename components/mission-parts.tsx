"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useId } from "react"

import {
  CalendarCheck,
  Check,
  ChevronRight,
  ClipboardList,
  Coffee,
  Croissant,
  Gift,
  IceCreamCone,
  Scale,
  Store,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"

import type { MissionListItem, MissionType } from "@/lib/api"
import { DAY } from "@/lib/issues"
import {
  DAILY_BONUS_POINTS,
  dailyProgress,
  formatPoints,
  MISSION_TYPE_LABEL,
  missionMeta,
  splitMissions,
  type DailyProgress,
} from "@/lib/mission"
import { useMe } from "@/lib/queries/auth"
import { useIssues } from "@/lib/queries/issue"
import { useMissions, useSubmitMission } from "@/lib/queries/mission"
import { useWallet } from "@/lib/queries/reward"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"

// 미션 탭·홈·마이·지갑이 함께 쓰는 조각. 리워드 포인트는 금색 "P" 동전, 신용도는 브랜드 보라로
// 구분한다 — 두 값을 한 카드에 섞어 보여 주지 않는다.

/** 리워드 포인트 동전. 글자 대신 쓰는 장식이라 스크린리더에는 숨긴다(옆에 "P"가 붙은 숫자가 있음). */
export function PointCoin({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-[22px] flex-none place-items-center rounded-full bg-point text-xs font-extrabold text-ink",
        className,
      )}
    >
      P
    </span>
  )
}

const PRODUCT_ICON: Record<string, LucideIcon> = {
  ICECREAM_1000: IceCreamCone,
  CVS_3000: Store,
  COFFEE_4500: Coffee,
  BAKERY_5000: Croissant,
}

/** 교환 상품 아이콘. 모르는 상품 코드는 선물 상자로 그린다. */
export function ProductIcon({
  code,
  className,
}: {
  code: string
  className?: string
}) {
  const Icon = PRODUCT_ICON[code] ?? Gift
  return <Icon aria-hidden className={className} />
}

const TYPE_TILE: Record<MissionType, { Icon: LucideIcon; className: string }> =
  {
    ATTENDANCE: { Icon: CalendarCheck, className: "bg-brand-soft text-brand" },
    BALANCE: { Icon: Scale, className: "bg-warn-soft text-warn-ink" },
    SURVEY: { Icon: ClipboardList, className: "bg-brand-soft text-brand" },
  }

/** 44px 유형 아이콘. 끝낸 미션은 초록 체크로 바뀐다. */
export function MissionTypeTile({
  type,
  done,
  className,
}: {
  type: MissionType
  done?: boolean
  className?: string
}) {
  const { Icon, className: tone } = done
    ? { Icon: Check, className: "bg-success-soft text-success-ink" }
    : TYPE_TILE[type]
  return (
    <span
      className={cn(
        "grid size-11 flex-none place-items-center rounded-[14px]",
        tone,
        className,
      )}
    >
      <Icon className="size-[22px]" strokeWidth={done ? 2.6 : 2} />
    </span>
  )
}

/** 오늘의 미션 진행 막대. 6개까지는 칸으로 나누고, 그보다 많으면 한 줄 막대로 그린다. */
export function DailySegments({
  progress,
  className,
}: {
  progress: DailyProgress
  className?: string
}) {
  const { total, approved } = progress
  if (total > 6) {
    return (
      <span
        className={cn(
          "h-2 overflow-hidden rounded-full bg-neutral-fill",
          className,
        )}
      >
        <span
          className="block h-2 rounded-full bg-brand"
          style={{ width: `${(approved / total) * 100}%` }}
        />
      </span>
    )
  }
  return (
    <span
      className={cn("grid gap-1", className)}
      style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-2 rounded-full",
            i < approved ? "bg-brand" : "bg-neutral-fill",
          )}
        />
      ))}
    </span>
  )
}

/** 오늘의 미션 보너스 안내 한 줄(미션 탭 카드 하단). */
export function DailyBonusNote({
  progress,
  className,
}: {
  progress: DailyProgress
  className?: string
}) {
  if (progress.bonus === "none") return null
  const { text, side, tone } =
    progress.bonus === "done"
      ? {
          text: `오늘의 미션을 모두 끝냈어요`,
          side: `보너스 +${DAILY_BONUS_POINTS}P 받음`,
          tone: "bg-success-soft",
        }
      : progress.bonus === "missed"
        ? {
            text: "반려된 미션이 있어 오늘 보너스는 받을 수 없어요",
            side: "",
            tone: "bg-track",
          }
        : {
            text: `모두 끝내면 보너스 +${DAILY_BONUS_POINTS}P`,
            side: `${progress.remaining}개 남음`,
            tone: "bg-warn-soft",
          }
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl px-4 py-3.5",
        tone,
        className,
      )}
    >
      <Gift
        className={cn(
          "size-[22px] flex-none",
          progress.bonus === "done"
            ? "text-success-ink"
            : progress.bonus === "missed"
              ? "text-sub"
              : "text-warn-ink",
        )}
      />
      <span className="flex-1 text-[15px] font-bold text-ink-2">{text}</span>
      {side && (
        <span
          className={cn(
            "text-[13px] font-extrabold whitespace-nowrap",
            progress.bonus === "done" ? "text-success-ink" : "text-warn-ink",
          )}
        >
          {side}
        </span>
      )}
    </div>
  )
}

function endsTodayChip(mission: MissionListItem, now: Date) {
  const ms = Date.parse(mission.endsAt) - now.getTime()
  if (
    ms > 0 &&
    ms < DAY &&
    new Date(mission.endsAt).getDate() === now.getDate()
  ) {
    return (
      <span className="rounded-lg bg-danger-soft px-2 py-0.5 text-xs font-bold text-danger-ink">
        오늘 마감
      </span>
    )
  }
  return null
}

/**
 * 미션 한 줄. 상태(참여 전·통과·반려·검수 중)마다 모양이 다르다.
 * row: 오늘의 미션 카드 안의 줄, card: 따로 떨어진 흰 카드(그 밖의 미션).
 */
export function MissionRow({
  mission,
  now,
  variant = "row",
  className,
}: {
  mission: MissionListItem
  now: Date
  variant?: "row" | "card"
  className?: string
}) {
  const href = `/mission/${mission.id}`
  const shell = cn(
    variant === "card"
      ? "rounded-[22px] bg-surface p-[18px]"
      : "min-h-[76px] py-2.5",
    "flex items-center gap-3",
    className,
  )

  if (mission.myStatus === "APPROVED") {
    return (
      <div className={shell}>
        <MissionTypeTile type={mission.type} done />
        <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className="text-[13px] font-semibold text-success-ink">
            {MISSION_TYPE_LABEL[mission.type]} ·{" "}
            {formatPoints(mission.rewardPoints)} 받음
          </span>
          <span className="truncate text-base font-bold text-sub">
            {mission.title}
          </span>
        </span>
        <Link
          href={href}
          className="flex h-11 flex-none items-center rounded-xl bg-track px-3.5 text-sm font-bold text-ink"
        >
          결과 보기
        </Link>
      </div>
    )
  }

  if (mission.myStatus === "REJECTED" || mission.myStatus === "PENDING") {
    const rejected = mission.myStatus === "REJECTED"
    return (
      <div className={cn(shell, "flex-col items-stretch gap-2.5")}>
        <span className="flex items-center gap-3">
          <MissionTypeTile type={mission.type} />
          <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-sub">
              {MISSION_TYPE_LABEL[mission.type]}
              <span
                className={cn(
                  "rounded-lg px-2 py-0.5 text-xs font-bold",
                  rejected
                    ? "bg-danger-soft text-danger-ink"
                    : "bg-warn-soft text-warn-ink",
                )}
              >
                {rejected ? "반려됐어요" : "검수 중"}
              </span>
            </span>
            <span className="truncate text-base font-bold">
              {mission.title}
            </span>
          </span>
        </span>
        {rejected && mission.myRejectReason && (
          <span className="rounded-xl bg-bg px-3 py-2.5 text-[13px] leading-normal font-medium text-ink-2">
            {mission.myRejectReason}
          </span>
        )}
      </div>
    )
  }

  return (
    <Link href={href} className={cn(shell, "text-ink")}>
      <MissionTypeTile type={mission.type} />
      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold text-sub">
          {missionMeta(mission)}
          {endsTodayChip(mission, now)}
        </span>
        <span className="text-base leading-snug font-bold">
          {mission.title}
        </span>
      </span>
      <span className="flex-none text-base font-extrabold tabular-nums">
        +{formatPoints(mission.rewardPoints)}
      </span>
    </Link>
  )
}

/**
 * 출석 체크 제출. 출석은 문항이 없어 검수 없이 통과하고, 같은 날 두 번 누르면 서버가 409로 막는다.
 * 비로그인이면 로그인 화면으로 보낸다.
 */
export function useAttendance(mission: MissionListItem) {
  const router = useRouter()
  const showToast = useToast()
  const { data: me } = useMe()
  const submit = useSubmitMission(mission.id)
  const attended = mission.myStatus === "APPROVED"

  function attend() {
    if (!me) {
      router.push("/login")
      return
    }
    if (attended || submit.isPending) return
    submit.mutate(
      { answers: [], durationMs: 0 },
      {
        onSuccess: (r) =>
          showToast(
            r.status === "APPROVED"
              ? `출석 완료 · +${formatPoints(r.earnedPoints)}`
              : "출석하지 못했어요",
          ),
        onError: (e) => showToast(e.message),
      },
    )
  }

  return { attend, attended, pending: submit.isPending }
}

/** 출석 체크 카드(미션 탭). */
export function AttendanceCard({
  mission,
  className,
}: {
  mission: MissionListItem
  className?: string
}) {
  const { attend, attended, pending } = useAttendance(mission)
  // 모바일·PC 트리에 한 번씩 그려지므로 id가 겹치지 않게 useId를 쓴다.
  const titleId = useId()
  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "flex flex-col gap-3.5 rounded-[22px] bg-surface p-5",
        className,
      )}
    >
      <h2
        id={titleId}
        className="flex items-center gap-2 text-[17px] font-extrabold"
      >
        <CalendarCheck className="size-[22px] text-brand" />
        {mission.title}
      </h2>
      {mission.description && (
        <p className="text-[13px] font-medium text-sub">
          {mission.description}
        </p>
      )}
      <button
        type="button"
        onClick={attend}
        disabled={attended || pending}
        className={cn(
          "h-[52px] rounded-[14px] text-base font-bold",
          attended
            ? "bg-neutral-fill text-sub"
            : "bg-brand text-white hover:bg-brand-hover disabled:opacity-60",
        )}
      >
        {attended
          ? "오늘 출석 완료 · 내일 또 만나요"
          : `출석하고 ${formatPoints(mission.rewardPoints)} 받기`}
      </button>
    </section>
  )
}

/** 열린 예측으로 이어 주는 카드. 예측은 신용도로 하고 포인트는 쓰이지 않는다는 점을 함께 적는다. */
export function PredictionBridge({ className }: { className?: string }) {
  const { data: me } = useMe()
  const { data: issues = [] } = useIssues(me?.userId)
  const titleId = useId()
  const next = issues
    .filter((i) => i.status === "OPEN")
    .sort(
      (a, b) => Date.parse(a.voteDeadlineAt) - Date.parse(b.voteDeadlineAt),
    )[0]
  if (!next) return null
  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "flex flex-col gap-2.5 rounded-[22px] bg-surface p-5",
        className,
      )}
    >
      <span className="flex items-center gap-2 text-[13px] font-bold text-brand">
        <TrendingUp className="size-[18px]" />
        지금 열린 예측
      </span>
      <h2
        id={titleId}
        className="text-[17px] leading-[1.4] font-extrabold tracking-[-0.03em]"
      >
        {next.title}
      </h2>
      <span className="text-[13px] font-medium text-sub">
        예측은 신용도로 참여해요. 포인트는 쓰이지 않아요.
      </span>
      <Link
        href={`/issue/${next.id}`}
        className="mt-0.5 flex h-12 items-center justify-center rounded-[14px] bg-brand-soft text-[15px] font-bold text-brand"
      >
        예측하러 가기
      </Link>
    </section>
  )
}

/** 마이 화면의 포인트 지갑 카드. 신용도 카드 아래에 따로 둔다. */
export function WalletSummaryCard({ className }: { className?: string }) {
  const { data: wallet } = useWallet()
  const requested =
    wallet?.exchanges.filter((e) => e.status === "REQUESTED").length ?? 0
  return (
    <Link
      href="/my/wallet"
      className={cn(
        "flex items-center gap-3.5 rounded-[22px] bg-surface p-[18px] pl-5",
        className,
      )}
    >
      <span className="grid size-[46px] flex-none place-items-center rounded-[14px] bg-ink">
        <PointCoin className="size-6" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="text-[13px] font-semibold text-sub">포인트 지갑</span>
        <span className="text-xl font-extrabold tracking-[-0.03em] tabular-nums">
          {wallet ? formatPoints(wallet.balance) : "—"}
        </span>
      </span>
      {requested > 0 && (
        <span className="rounded-[11px] bg-warn-soft px-[9px] py-1 text-xs font-extrabold whitespace-nowrap text-warn-ink">
          교환 확인 중 {requested}
        </span>
      )}
      <ChevronRight className="size-5 flex-none text-disabled-ink" />
    </Link>
  )
}

/** 마이 화면의 오늘의 미션 바로가기. 끝낼 미션이 남았을 때만 보인다. */
export function DailyMissionBanner({ className }: { className?: string }) {
  const { data: missions = [] } = useMissions()
  const progress = dailyProgress(missions)
  if (progress.bonus !== "open") return null
  return (
    <Link
      href="/mission"
      className={cn(
        "flex items-center gap-3 rounded-[22px] bg-brand-soft px-5 py-4 text-ink-2",
        className,
      )}
    >
      <Target className="size-5 flex-none text-brand" />
      <span className="flex-1 text-sm font-bold">
        오늘의 미션 {progress.approved}/{progress.total} · {progress.remaining}
        개 더 하면 보너스 +{DAILY_BONUS_POINTS}P
      </span>
      <ChevronRight className="size-[18px] flex-none text-brand" />
    </Link>
  )
}

/** 모바일 홈의 "오늘의 미션" 섹션. 오늘의 미션도 출석도 없으면 섹션째 숨긴다. */
export function HomeMissionSection() {
  const { data: missions = [], isLoading } = useMissions()
  const { attendance, daily } = splitMissions(missions)
  const progress = dailyProgress(missions)
  if (isLoading || (daily.length === 0 && !attendance)) return null
  const todo = daily.filter((m) => m.myStatus === null).slice(0, 3)

  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex items-center gap-[7px] px-5">
        <Target className="size-[18px] text-brand" />
        <h2 className="text-lg font-extrabold tracking-[-0.03em]">
          오늘의 미션
        </h2>
        <span className="flex-1" />
        <Link
          href="/mission"
          className="flex h-11 items-center gap-px text-[13px] font-semibold text-muted"
        >
          전체 보기
          <ChevronRight className="size-[15px]" />
        </Link>
      </div>
      {daily.length > 0 && (
        <Link
          href="/mission"
          className="mx-4 flex flex-col gap-3 rounded-[22px] bg-surface p-[18px] text-ink"
        >
          <span className="flex items-center justify-between gap-3">
            <span className="text-base font-extrabold">
              {progress.total}개 중 {progress.approved}개 완료
            </span>
            {progress.bonus === "open" && (
              <span className="text-[13px] font-bold text-warn-ink">
                모두 끝내면 +{DAILY_BONUS_POINTS}P
              </span>
            )}
            {progress.bonus === "done" && (
              <span className="text-[13px] font-bold text-success-ink">
                보너스 +{DAILY_BONUS_POINTS}P 받음
              </span>
            )}
          </span>
          <DailySegments progress={progress} />
          {todo.length > 0 && (
            <span className="flex flex-col">
              {todo.map((m, i) => (
                <span
                  key={m.id}
                  className={cn(
                    "flex min-h-12 items-center justify-between gap-3",
                    i < todo.length - 1 && "border-b border-line-3",
                  )}
                >
                  <span className="truncate text-[15px] font-semibold">
                    {m.title}
                  </span>
                  <span className="flex-none text-[15px] font-extrabold tabular-nums">
                    +{formatPoints(m.rewardPoints)}
                  </span>
                </span>
              ))}
            </span>
          )}
        </Link>
      )}
      {attendance && <HomeAttendanceRow mission={attendance} />}
    </section>
  )
}

function HomeAttendanceRow({ mission }: { mission: MissionListItem }) {
  const { attend, attended, pending } = useAttendance(mission)
  return (
    <div className="mx-4 flex items-center gap-3 rounded-[18px] bg-surface px-4 py-3.5">
      <CalendarCheck
        className={cn(
          "size-[22px] flex-none",
          attended ? "text-success-ink" : "text-brand",
        )}
      />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-bold">
          {attended
            ? "오늘 출석 완료"
            : `출석하고 ${formatPoints(mission.rewardPoints)} 받기`}
        </span>
        <span className="text-[13px] font-semibold text-sub">
          {attended ? "내일 또 만나요" : "하루 한 번"}
        </span>
      </span>
      {!attended && (
        <button
          type="button"
          onClick={attend}
          disabled={pending}
          className="flex h-11 flex-none items-center rounded-full bg-brand px-4 text-sm font-bold text-white disabled:opacity-60"
        >
          출석
        </button>
      )}
    </div>
  )
}
