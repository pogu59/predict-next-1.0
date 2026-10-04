"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import {
  Circle,
  CircleCheck,
  CircleX,
  Copy,
  History,
  RotateCcw,
} from "lucide-react"

import type { Issue } from "@/lib/api"
import { crowdRow } from "@/lib/insights"
import { optionPercents } from "@/lib/issues"
import { useMe } from "@/lib/queries/auth"
import { useIssues } from "@/lib/queries/issue"
import {
  gradeAnswer,
  pickRound,
  REWIND_MIN_POOL,
  REWIND_ROUND_SIZE,
  rewindPool,
  type RewindGrade,
} from "@/lib/rewind"
import { cn } from "@/lib/utils"
import { SubHeader } from "@/components/sub-header"
import { useToast } from "@/components/ui/toast"

const BEST_KEY = "rewind_best"

type Best = { correct: number; virtual: number }
type Answer = { issue: Issue; optionId: number; grade: RewindGrade }
type Phase = "intro" | "question" | "reveal" | "result"

function readBest(): Best | null {
  try {
    const raw = localStorage.getItem(BEST_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return typeof parsed?.correct === "number" &&
      typeof parsed?.virtual === "number"
      ? parsed
      : null
  } catch {
    return null
  }
}

function writeBest(best: Best) {
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify(best))
  } catch {
    // 저장이 막혀도 리와인드는 계속된다.
  }
}

const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`)

/** 리와인드 — 확정된 지난 이슈를 비율을 가린 채 다시 풀고 다수의 감과 비교한다. 신용도는 오가지 않는다. */
export default function RewindPage() {
  const { data: me } = useMe()
  const { data: issues = [], isLoading, error } = useIssues(me?.userId)
  const pool = rewindPool(issues)

  const [phase, setPhase] = useState<Phase>("intro")
  const [round, setRound] = useState<Issue[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [best, setBest] = useState<Best | null>(null)

  // 최고 기록은 브라우저 저장소에 있으므로 서버 렌더와 어긋나지 않게 마운트 후에 읽는다.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBest(readBest())
  }, [])

  function start() {
    // 셔플은 버튼을 누른 뒤(클라이언트)에만 한다.
    setRound(pickRound(pool))
    setAnswers([])
    setPhase("question")
  }

  function answer(optionId: number) {
    const issue = round[answers.length]
    setAnswers((prev) => [
      ...prev,
      { issue, optionId, grade: gradeAnswer(issue, optionId) },
    ])
    setPhase("reveal")
  }

  function next() {
    if (answers.length < round.length) {
      setPhase("question")
      return
    }
    const correct = answers.filter((a) => a.grade.correct).length
    const virtual = answers.reduce((sum, a) => sum + a.grade.virtual, 0)
    if (
      !best ||
      correct > best.correct ||
      (correct === best.correct && virtual > best.virtual)
    ) {
      const record = { correct, virtual }
      writeBest(record)
      setBest(record)
    }
    setPhase("result")
  }

  return (
    <div className="pb-10 lg:mx-auto lg:max-w-[640px] lg:pb-0">
      <SubHeader title="리와인드" fallback="/" />
      <div className="px-4 pt-2 lg:px-0 lg:pt-0">
        {phase === "intro" &&
          (isLoading || error ? (
            <div className="py-[60px] text-center text-sm text-faint">
              {error ? error.message : "불러오는 중..."}
            </div>
          ) : (
            <Intro poolSize={pool.length} best={best} onStart={start} />
          ))}
        {phase === "question" && round[answers.length] && (
          <Question
            issue={round[answers.length]}
            index={answers.length}
            total={round.length}
            onAnswer={answer}
          />
        )}
        {phase === "reveal" && answers.length > 0 && (
          <Reveal
            answer={answers[answers.length - 1]}
            index={answers.length - 1}
            total={round.length}
            onNext={next}
          />
        )}
        {phase === "result" && (
          <Result answers={answers} best={best} onRestart={start} />
        )}
      </div>
    </div>
  )
}

function Progress({ index, total }: { index: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold tabular-nums">
        {index + 1} / {total}
      </span>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-300"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>
    </div>
  )
}

function Intro({
  poolSize,
  best,
  onStart,
}: {
  poolSize: number
  best: Best | null
  onStart: () => void
}) {
  const enough = poolSize >= REWIND_MIN_POOL
  const size = Math.min(REWIND_ROUND_SIZE, poolSize)
  return (
    <section className="flex flex-col items-start gap-3 rounded-3xl bg-surface p-6 lg:p-8">
      <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
        <History className="size-6" />
      </span>
      <h1 className="text-2xl font-extrabold tracking-[-0.04em] lg:text-[30px]">
        리와인드
      </h1>
      <p className="text-[15px] leading-[1.6] text-sub">
        이미 결과가 나온 예측을 다시 풀어봐요. 비율은 가려져 있어요. 신용도에는
        영향이 없어요.
      </p>
      {enough ? (
        <>
          <span className="text-sm font-semibold text-muted tabular-nums">
            다시 풀 수 있는 예측 {poolSize}개
            {best &&
              ` · 최고 기록 ${best.correct}개 적중 (${signed(best.virtual)})`}
          </span>
          <button
            type="button"
            onClick={onStart}
            className="mt-2 h-[54px] w-full rounded-2xl bg-brand text-base font-bold text-white focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {size}문제 시작
          </button>
        </>
      ) : (
        <>
          <span className="text-[15px] font-bold">
            아직 다시 풀 예측이 부족해요
          </span>
          <Link
            href="/issue"
            className="mt-1 flex h-11 items-center rounded-[13px] bg-ink px-4 text-sm font-bold text-white"
          >
            진행 중인 예측 보기
          </Link>
        </>
      )}
    </section>
  )
}

function Question({
  issue,
  index,
  total,
  onAnswer,
}: {
  issue: Issue
  index: number
  total: number
  onAnswer: (optionId: number) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const month = new Date(issue.voteDeadlineAt).getMonth() + 1
  return (
    <section key={issue.id} className="flex flex-col gap-4">
      <Progress index={index} total={total} />
      <div className="flex flex-col gap-2 rounded-3xl bg-surface p-5 lg:p-7">
        <span className="text-[13px] font-bold text-brand">
          지난 {month}월 예측
        </span>
        <h2 className="text-xl leading-[1.4] font-extrabold tracking-[-0.03em] text-pretty lg:text-2xl">
          {issue.title}
        </h2>
        {issue.description && (
          <div className="flex flex-col items-start gap-1">
            <p
              className={cn(
                "text-sm leading-[1.65] whitespace-pre-wrap text-sub",
                !expanded && "line-clamp-2",
              )}
            >
              {issue.description}
            </p>
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="text-[13px] font-semibold text-muted"
            >
              {expanded ? "접기" : "더보기"}
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {issue.options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onAnswer(o.id)}
            className="flex min-h-[56px] items-center gap-3 rounded-2xl bg-surface px-4 text-left shadow-card focus-visible:shadow-selected focus-visible:outline-none active:scale-[.99]"
          >
            <Circle className="size-[22px] flex-none text-disabled-ink" />
            <span className="flex-1 text-[15px] font-semibold">{o.text}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function Reveal({
  answer,
  index,
  total,
  onNext,
}: {
  answer: Answer
  index: number
  total: number
  onNext: () => void
}) {
  const { issue, optionId, grade } = answer
  const pct = optionPercents(issue.options)
  const crowd = crowdRow(issue)
  const minorityHit =
    grade.correct && crowd != null && grade.pct < crowd.leaderPct
  const nextRef = useRef<HTMLButtonElement>(null)

  // 포커스를 다음 버튼에 두어 Enter로 바로 넘어가게 한다.
  useEffect(() => nextRef.current?.focus(), [])

  return (
    <section className="flex flex-col gap-4">
      <Progress index={index} total={total} />
      <div className="flex flex-col gap-2 rounded-3xl bg-surface p-5 lg:p-7">
        <h2 className="text-lg leading-[1.4] font-extrabold tracking-[-0.03em] text-pretty">
          {issue.title}
        </h2>
        <span
          className={cn(
            "flex items-center gap-1.5 text-lg font-extrabold tabular-nums",
            grade.correct ? "text-brand" : "text-ink",
          )}
        >
          {grade.correct ? (
            <CircleCheck className="size-5" />
          ) : (
            <CircleX className="size-5 text-muted" />
          )}
          {grade.correct ? "맞혔어요" : "빗나갔어요"} · 실전이었다면{" "}
          {signed(grade.virtual)}
        </span>
        {minorityHit && (
          <span className="self-start rounded-lg bg-brand-soft px-2.5 py-1.5 text-[13px] font-bold text-brand tabular-nums">
            {grade.pct}%만 고른 쪽을 맞혔어요
          </span>
        )}
        {crowd && (
          <span className="text-[13px] text-sub">
            다수는 &apos;{crowd.leaderText}&apos;를 골랐어요 ·{" "}
            {crowd.crowdRight ? "다수가 맞혔어요" : "다수가 빗나갔어요"}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {issue.options.map((o) => {
          const correct = o.id === issue.correctOptionId
          const mine = o.id === optionId
          const strong = correct || mine
          return (
            <div
              key={o.id}
              className={cn(
                "relative flex min-h-[56px] items-center gap-3 overflow-hidden rounded-2xl bg-surface px-4",
                mine ? "shadow-selected" : "shadow-card",
              )}
            >
              <div
                className={cn(
                  "absolute inset-y-0 left-0 transition-[width] duration-600 ease-out-expo",
                  strong ? "bg-brand-fill" : "bg-[#F1F1EF]",
                )}
                style={{ width: `${pct[o.id] ?? 0}%` }}
              />
              {correct ? (
                <CircleCheck className="relative size-[22px] flex-none text-brand" />
              ) : (
                <Circle
                  className={cn(
                    "relative size-[22px] flex-none",
                    mine ? "text-brand" : "text-disabled-ink",
                  )}
                />
              )}
              <span className="relative flex-1 text-[15px] font-semibold">
                {o.text}
              </span>
              {correct && (
                <span className="relative rounded-md bg-brand px-[7px] py-[3px] text-[11px] font-bold text-white">
                  정답
                </span>
              )}
              {mine && !correct && (
                <span className="relative rounded-md bg-ink px-[7px] py-[3px] text-[11px] font-bold text-white">
                  내 선택
                </span>
              )}
              <span className="relative min-w-10 text-right text-[15px] font-bold tabular-nums">
                {pct[o.id] ?? 0}%
              </span>
            </div>
          )
        })}
      </div>
      <button
        ref={nextRef}
        type="button"
        onClick={onNext}
        className="h-[54px] rounded-2xl bg-ink text-base font-bold text-white focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        {index + 1 < total ? "다음 문제" : "결과 보기"}
      </button>
      <Link
        href={`/issue/${issue.id}`}
        className="self-center text-[13px] font-semibold text-muted"
      >
        원래 이슈 보기
      </Link>
    </section>
  )
}

function Result({
  answers,
  best,
  onRestart,
}: {
  answers: Answer[]
  best: Best | null
  onRestart: () => void
}) {
  const showToast = useToast()
  const total = answers.length
  const mine = answers.filter((a) => a.grade.correct).length
  const crowd = answers.filter((a) => a.grade.crowdRight).length
  const virtual = answers.reduce((sum, a) => sum + a.grade.virtual, 0)

  function copy() {
    const squares = answers.map((a) => (a.grade.correct ? "🟪" : "⬜")).join("")
    const text = `predict 리와인드 ${mine}/${total} (다수 ${crowd}/${total}) ${squares} ${window.location.origin}/rewind`
    const done = navigator.clipboard?.writeText(text) ?? Promise.reject()
    done.then(
      () => showToast("결과를 복사했어요"),
      () => showToast("복사하지 못했어요"),
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-4 rounded-3xl bg-surface p-6 lg:p-8">
        <div className="grid w-full grid-cols-2 gap-2.5">
          <div className="flex flex-col items-center gap-1 rounded-[20px] bg-brand-soft py-5">
            <span className="text-sm font-bold text-brand">나</span>
            <span className="text-[44px] leading-none font-extrabold tracking-[-0.04em] text-brand tabular-nums">
              {mine}/{total}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-[20px] bg-track py-5">
            <span className="text-sm font-bold text-sub">다수</span>
            <span className="text-[44px] leading-none font-extrabold tracking-[-0.04em] tabular-nums">
              {crowd}/{total}
            </span>
          </div>
        </div>
        <span className="text-[15px] font-bold tabular-nums">
          실전이었다면 {signed(virtual)}
        </span>
        <div className="flex gap-1.5">
          {answers.map((a, i) => (
            <span
              key={a.issue.id}
              title={a.issue.title}
              className={cn(
                "grid size-9 place-items-center rounded-full text-[13px] font-bold tabular-nums",
                a.grade.correct ? "bg-brand text-white" : "bg-track text-muted",
              )}
            >
              {i + 1}
            </span>
          ))}
        </div>
        {best && (
          <span className="text-xs font-semibold text-muted tabular-nums">
            최고 기록 {best.correct}개 적중 ({signed(best.virtual)})
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onRestart}
        className="flex h-[54px] items-center justify-center gap-2 rounded-2xl bg-brand text-base font-bold text-white"
      >
        <RotateCcw className="size-5" />
        다시 풀기
      </button>
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/issue"
          className="flex h-12 items-center justify-center rounded-2xl bg-ink text-sm font-bold text-white"
        >
          진행 중인 예측 하러 가기
        </Link>
        <button
          type="button"
          onClick={copy}
          className="flex h-12 items-center justify-center gap-1.5 rounded-2xl bg-surface text-sm font-bold shadow-card"
        >
          <Copy className="size-4" />
          결과 복사
        </button>
      </div>
    </section>
  )
}
