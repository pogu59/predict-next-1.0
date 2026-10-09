"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import {
  Check,
  ChevronLeft,
  CircleCheck,
  CircleX,
  Gift,
  Hourglass,
  Lock,
  X,
  type LucideIcon,
} from "lucide-react"

import type {
  MissionDetail,
  SubmissionStatus,
  SubmitMissionResult,
} from "@/lib/api"
import {
  DAILY_BONUS_POINTS,
  dailyProgress,
  formatPoints,
  MISSION_TYPE_LABEL,
} from "@/lib/mission"
import { useMe } from "@/lib/queries/auth"
import {
  useMission,
  useMissionResults,
  useMissions,
  useSubmitMission,
} from "@/lib/queries/mission"
import { cn } from "@/lib/utils"
import {
  AttendanceCard,
  PointCoin,
  PredictionBridge,
} from "@/components/mission-parts"
import { useToast } from "@/components/ui/toast"

/**
 * 미션 참여 화면. 한 화면에 문항 하나씩 → 제출하면 서버가 바로 검수하고, 결과(적립·반려)와
 * 다른 사람들의 응답 비율을 같은 주소에서 보여 준다. 이미 참여한 미션으로 들어오면 결과부터 보인다.
 */
export default function MissionDoPage() {
  const params = useParams<{ id: string }>()
  const missionId = Number(params.id)
  const valid = Number.isInteger(missionId) && missionId > 0
  const { data: me, isLoading: meLoading } = useMe()
  const { data: mission, error } = useMission(valid ? missionId : undefined)
  const [result, setResult] = useState<SubmitMissionResult | null>(null)

  if (!valid || error) {
    return (
      <Notice
        Icon={CircleX}
        tone="bg-track text-sub"
        title="미션을 찾을 수 없어요"
        description="주소가 바뀌었거나 아직 공개되지 않은 미션이에요."
      />
    )
  }
  if (meLoading || !mission)
    return (
      <div className="py-24 text-center text-sm text-faint">불러오는 중...</div>
    )

  const status = result?.status ?? mission.myStatus
  if (status) {
    return (
      <ResultView
        mission={mission}
        status={status}
        result={result}
        rejectReason={result?.rejectReason ?? mission.myRejectReason}
      />
    )
  }
  if (!mission.available) {
    return (
      <Notice
        Icon={Lock}
        tone="bg-track text-sub"
        title="참여 기간이 끝난 미션이에요"
        description="미션 탭에서 지금 열린 다른 미션을 확인해 보세요."
      />
    )
  }
  if (!me) {
    return (
      <Notice
        Icon={PointCoinIcon}
        tone="bg-ink"
        title={mission.title}
        description={`로그인하면 참여하고 ${formatPoints(mission.rewardPoints)}를 받을 수 있어요.`}
        action={{ href: "/login", label: "로그인하고 참여하기" }}
      />
    )
  }
  if (mission.type === "ATTENDANCE") {
    return (
      <Shell>
        <BackHeader mission={mission} />
        <div className="px-4 pt-6 lg:px-0">
          <AttendanceCard mission={{ ...mission, questionCount: 0 }} />
        </div>
      </Shell>
    )
  }
  return <QuestionFlow mission={mission} onDone={setResult} />
}

// ---- 공통 틀 ----

/** 모바일은 화면 전체, PC는 가운데 560px 카드. */
function Shell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex min-h-dvh flex-col lg:mx-auto lg:min-h-0 lg:max-w-[560px] lg:rounded-3xl lg:bg-surface lg:px-8 lg:pt-4 lg:pb-8",
        className,
      )}
    >
      {children}
    </div>
  )
}

function RewardPill({ points }: { points: number }) {
  return (
    <span className="flex items-center gap-[5px] rounded-full bg-ink px-2.5 py-1.5 text-[13px] font-bold text-white tabular-nums">
      <PointCoin className="size-[18px] text-[10px]" />+{formatPoints(points)}
    </span>
  )
}

function BackHeader({ mission }: { mission: MissionDetail }) {
  return (
    <header className="flex h-[60px] items-center justify-between pr-2 pl-1 lg:px-0">
      <Link
        href="/mission"
        aria-label="미션 목록으로 돌아가기"
        className="grid size-11 place-items-center text-ink"
      >
        <ChevronLeft className="size-6" />
      </Link>
      <span className="text-[15px] font-bold">
        {MISSION_TYPE_LABEL[mission.type]}
      </span>
      <RewardPill points={mission.rewardPoints} />
    </header>
  )
}

function PointCoinIcon({ className }: { className?: string }) {
  return <PointCoin className={cn("size-8 text-base", className)} />
}

function Notice({
  Icon,
  tone,
  title,
  description,
  action = { href: "/mission", label: "미션 목록으로" },
}: {
  Icon: LucideIcon | typeof PointCoinIcon
  tone: string
  title: string
  description: string
  action?: { href: string; label: string }
}) {
  return (
    <Shell className="items-center justify-center gap-3 px-6 text-center lg:py-16">
      <span
        className={cn("grid size-[68px] place-items-center rounded-full", tone)}
      >
        <Icon className="size-8" />
      </span>
      <h1 className="text-[22px] font-extrabold tracking-[-0.04em]">{title}</h1>
      <p className="text-[15px] font-medium text-sub">{description}</p>
      <Link
        href={action.href}
        className="mt-3 flex h-[52px] items-center rounded-[14px] bg-ink px-6 text-base font-bold text-white"
      >
        {action.label}
      </Link>
    </Shell>
  )
}

// ---- 문항 풀기 ----

function QuestionFlow({
  mission,
  onDone,
}: {
  mission: MissionDetail
  onDone: (r: SubmitMissionResult) => void
}) {
  const showToast = useToast()
  const submit = useSubmitMission(mission.id)
  const questions = [...mission.questions].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  )
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    questions.map(() => null),
  )
  // 화면을 연 시각. 서버가 "너무 빠른 응답"을 판정하는 데 쓰는 durationMs의 기준이다.
  const startedAt = useRef<number | null>(null)

  useEffect(() => {
    startedAt.current = Date.now()
  }, [])

  const q = questions[step]
  const picked = answers[step]
  const last = step === questions.length - 1

  function pick(index: number) {
    setAnswers((prev) => prev.map((v, i) => (i === step ? index : v)))
  }

  function next() {
    if (picked == null || submit.isPending) return
    if (!last) {
      setStep(step + 1)
      return
    }
    const durationMs = Date.now() - (startedAt.current ?? Date.now())
    submit.mutate(
      { answers: answers as number[], durationMs },
      {
        onSuccess: (r) => {
          onDone(r)
          if (r.status === "APPROVED" && r.earnedPoints + r.bonusPoints > 0) {
            showToast(
              `+${formatPoints(r.earnedPoints + r.bonusPoints)} 적립됐어요`,
            )
          }
        },
        onError: (e) => showToast(e.message),
      },
    )
  }

  if (!q) {
    return (
      <Notice
        Icon={CircleX}
        tone="bg-track text-sub"
        title="문항이 없는 미션이에요"
        description="운영자가 미션을 준비하고 있어요."
      />
    )
  }

  return (
    <Shell>
      <BackHeader mission={mission} />
      <div className="flex flex-col gap-2 px-5 pt-1 lg:px-0">
        <div className="flex justify-between text-[13px] font-bold text-sub tabular-nums">
          <span>
            {step + 1} / {questions.length}
          </span>
          {mission.daily && <span>오늘의 미션</span>}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-neutral-fill">
          <div
            className="h-1.5 rounded-full bg-brand transition-[width] duration-300"
            style={{ width: `${((step + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-[22px] px-5 pt-8 lg:px-0">
        <div className="flex flex-col gap-2">
          <h1
            id="question-text"
            className="text-2xl leading-[1.35] font-extrabold tracking-[-0.04em]"
          >
            {q.text}
          </h1>
          {step === 0 && mission.description && (
            <p className="text-sm font-medium text-sub">
              {mission.description}
            </p>
          )}
        </div>
        <div
          role="group"
          aria-labelledby="question-text"
          className="flex flex-col gap-2.5"
        >
          {q.options.map((label, i) => {
            const on = picked === i
            return (
              <button
                key={i}
                type="button"
                aria-pressed={on}
                onClick={() => pick(i)}
                className={cn(
                  "flex min-h-[60px] items-center gap-3 rounded-2xl border-2 px-[18px] py-3 text-left text-[17px]",
                  on
                    ? "border-brand bg-brand-soft font-bold"
                    : "border-line-2 bg-surface font-semibold",
                )}
              >
                <span
                  className={cn(
                    "grid size-[22px] flex-none place-items-center rounded-full border-2",
                    on
                      ? "border-brand bg-brand text-white"
                      : "border-disabled-ink",
                  )}
                >
                  {on && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="sticky bottom-0 flex flex-col gap-3 bg-bg px-5 pt-4 pb-8 lg:static lg:bg-transparent lg:px-0 lg:pt-8 lg:pb-0">
        <p className="text-center text-[13px] font-medium text-sub">
          성실하게 답하면 검수 후 바로 적립돼요
        </p>
        <div className="grid grid-cols-[1fr_2fr] gap-2.5">
          {step === 0 ? (
            <Link
              href="/mission"
              className="flex h-[54px] items-center justify-center rounded-[14px] border-[1.5px] border-line-2 bg-surface text-base font-bold text-ink"
            >
              나가기
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="h-[54px] rounded-[14px] border-[1.5px] border-line-2 bg-surface text-base font-bold text-ink"
            >
              이전
            </button>
          )}
          <button
            type="button"
            onClick={next}
            disabled={picked == null || submit.isPending}
            className="h-[54px] rounded-[14px] bg-brand text-base font-bold text-white hover:bg-brand-hover disabled:bg-disabled-bg disabled:text-sub"
          >
            {last ? (submit.isPending ? "제출하는 중..." : "제출하기") : "다음"}
          </button>
        </div>
      </div>
    </Shell>
  )
}

// ---- 결과 ----

function ResultView({
  mission,
  status,
  result,
  rejectReason,
}: {
  mission: MissionDetail
  status: SubmissionStatus
  /** 방금 제출했으면 그 응답(적립·보너스 포인트). 다시 들어온 경우 null. */
  result: SubmitMissionResult | null
  rejectReason: string | null
}) {
  const { data: results } = useMissionResults(mission.id, true)
  const { data: missions = [] } = useMissions()
  const progress = dailyProgress(missions)
  const questions = results?.questions ?? []

  const head =
    status === "APPROVED"
      ? {
          Icon: CircleCheck,
          tone: "bg-success-soft text-success-ink",
          title: result
            ? result.earnedPoints > 0
              ? `+${formatPoints(result.earnedPoints)} 적립됐어요`
              : "참여해 줘서 고마워요"
            : "참여한 미션이에요",
          sub: result
            ? "검수를 통과해서 지갑에 바로 들어갔어요"
            : `검수를 통과해서 ${formatPoints(mission.rewardPoints)}를 받았어요`,
        }
      : status === "REJECTED"
        ? {
            Icon: CircleX,
            tone: "bg-danger-soft text-danger-ink",
            title: "이번 미션은 인정되지 않았어요",
            sub: rejectReason ?? "검수 기준에 맞지 않았어요.",
          }
        : {
            Icon: Hourglass,
            tone: "bg-warn-soft text-warn-ink",
            title: "검수 중이에요",
            sub: "확인이 끝나면 지갑에 들어가요.",
          }

  const bonusLine =
    result && result.bonusPoints > 0
      ? {
          text: `오늘의 미션을 모두 끝내서 보너스 +${formatPoints(result.bonusPoints)}도 받았어요`,
          tone: "bg-success-soft text-success-ink",
        }
      : mission.daily && progress.bonus === "open"
        ? {
            text: `오늘의 미션 ${progress.approved}/${progress.total} · ${progress.remaining}개 더 하면 보너스 +${DAILY_BONUS_POINTS}P`,
            tone: "bg-warn-soft text-warn-ink",
          }
        : null

  return (
    <Shell className="gap-4 px-4 pb-8 lg:px-8">
      <header className="flex h-[60px] items-center justify-end">
        <Link
          href="/mission"
          aria-label="닫고 미션 목록으로"
          className="grid size-11 place-items-center text-ink"
        >
          <X className="size-6" />
        </Link>
      </header>

      <section
        aria-label="참여 결과"
        className="flex flex-col items-center gap-3 pt-2 pb-3 text-center"
      >
        <span
          className={cn(
            "grid size-[68px] place-items-center rounded-full",
            head.tone,
          )}
        >
          <head.Icon className="size-[34px]" />
        </span>
        <h1 className="text-[28px] font-extrabold tracking-[-0.045em] tabular-nums">
          {head.title}
        </h1>
        <p className="max-w-[320px] text-[15px] leading-normal font-medium text-sub">
          {head.sub}
        </p>
        {bonusLine && (
          <span
            className={cn(
              "mt-1 flex items-center gap-2 rounded-[18px] px-3.5 py-2 text-sm font-bold",
              bonusLine.tone,
            )}
          >
            <Gift className="size-[18px] flex-none" />
            {bonusLine.text}
          </span>
        )}
      </section>

      {questions.length > 0 && (
        <section
          aria-label="다른 사람들의 답"
          className="flex flex-col gap-6 rounded-[22px] bg-surface px-5 py-[22px] lg:bg-bg"
        >
          {questions.map((rq) => {
            const total = rq.percents.reduce((a, b) => a + b, 0)
            const top = Math.max(...rq.percents)
            const mine = rq.myAnswer
            return (
              <div key={rq.questionId} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[13px] font-bold text-sub">
                    다른 사람들은 이렇게 답했어요
                  </span>
                  <h2 className="text-lg font-extrabold tracking-[-0.03em]">
                    {rq.text}
                  </h2>
                </div>
                {total === 0 ? (
                  <span className="text-sm text-sub">
                    아직 집계된 답이 없어요
                  </span>
                ) : (
                  rq.options.map((label, i) => {
                    const pct = rq.percents[i] ?? 0
                    const isMine = mine === i
                    return (
                      <div key={i} className="flex flex-col gap-1.5">
                        <div
                          className={cn(
                            "flex justify-between text-sm",
                            isMine ? "font-extrabold" : "font-semibold",
                          )}
                        >
                          <span className="flex items-center gap-1.5">
                            {label}
                            {isMine && (
                              <span className="rounded-lg bg-brand px-[7px] py-0.5 text-[11px] font-bold text-white">
                                내 답
                              </span>
                            )}
                          </span>
                          <span
                            className={cn(
                              "tabular-nums",
                              isMine ? "text-brand" : "text-sub",
                            )}
                          >
                            {pct}%
                          </span>
                        </div>
                        <div
                          className={cn(
                            "h-2.5 rounded-full",
                            isMine ? "bg-brand-soft" : "bg-track",
                          )}
                        >
                          <div
                            className={cn(
                              "h-2.5 rounded-full",
                              isMine ? "bg-brand" : "bg-disabled-ink",
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
                {questions.length === 1 && total > 0 && mine != null && (
                  <p className="rounded-[14px] bg-brand-soft px-3.5 py-3 text-sm font-semibold text-ink-2">
                    나와 같은 답을 고른 사람은{" "}
                    <span className="font-extrabold text-brand">
                      {rq.percents[mine] ?? 0}%
                    </span>
                    예요.
                    {(rq.percents[mine] ?? 0) === top && " 가장 많은 답이에요."}
                  </p>
                )}
              </div>
            )
          })}
        </section>
      )}

      <PredictionBridge className="lg:bg-bg" />

      <div className="mt-auto grid grid-cols-2 gap-2.5 pt-2">
        <Link
          href="/my/wallet"
          className="flex h-[54px] items-center justify-center rounded-[14px] border-[1.5px] border-line-2 bg-surface text-base font-bold text-ink"
        >
          지갑 보기
        </Link>
        <Link
          href="/mission"
          className="flex h-[54px] items-center justify-center rounded-[14px] bg-brand text-base font-bold text-white hover:bg-brand-hover"
        >
          다음 미션
        </Link>
      </div>
    </Shell>
  )
}
