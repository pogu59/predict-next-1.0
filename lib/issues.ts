import { useEffect, useState } from "react"

import type { BackendIssueStatus, IssueOption } from "@/lib/api"

export const MINUTE = 60_000
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

const pad = (n: number) => String(n).padStart(2, "0")

/**
 * 선택지별 0~100 정수 비율(optionId -> %). 서버가 percent를 주면 그대로 쓰고,
 * 아니면 voteCount로 계산한다 — 반올림 합이 100이 안 되면 가장 큰 값에 차이를 더한다. 전체 0이면 모두 0%.
 * voteCount 자체는 절대 화면에 노출하지 않는다(참여 인원 비공개).
 */
export function optionPercents(options: IssueOption[]): Record<number, number> {
  const result: Record<number, number> = {}
  if (options.length > 0 && options.every((o) => typeof o.percent === "number")) {
    for (const o of options) result[o.id] = o.percent as number
    return result
  }
  const total = options.reduce((sum, o) => sum + (o.voteCount ?? 0), 0)
  if (total === 0) {
    for (const o of options) result[o.id] = 0
    return result
  }
  const rounded = options.map((o) => Math.round(((o.voteCount ?? 0) / total) * 100))
  const diff = 100 - rounded.reduce((a, b) => a + b, 0)
  if (diff) {
    let maxIndex = 0
    rounded.forEach((x, i) => {
      if (x > rounded[maxIndex]) maxIndex = i
    })
    rounded[maxIndex] += diff
  }
  options.forEach((o, i) => {
    result[o.id] = rounded[i]
  })
  return result
}

/** 비율이 가장 높은 선택지(동률이면 먼저 나온 것). */
export function leadingOption(options: IssueOption[]) {
  const pct = optionPercents(options)
  return options.reduce<IssueOption | undefined>(
    (best, o) => (!best || pct[o.id] > pct[best.id] ? o : best),
    undefined,
  )
}

/** 24시간 미만이면 "HH:MM:SS 남음", 이상이면 "D-n". */
export function remainLabel(ms: number) {
  if (ms <= 0) return "마감"
  if (ms < DAY) {
    const s = Math.floor(ms / 1000)
    return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)} 남음`
  }
  return `D-${Math.ceil(ms / DAY)}`
}

/** "10월 4일 18:30" */
export function formatDateTime(iso: string | number) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** "10월 4일" */
export function formatDate(iso: string | number) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

export function timeAgo(iso: string, now: Date | number = Date.now()) {
  const minutes = Math.floor((Number(now) - Date.parse(iso)) / MINUTE)
  if (minutes < 1) return "방금"
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

/** <input type="datetime-local"> 값(로컬 시각) — 백엔드 LocalDateTime도 같은 형식을 받는다. */
export function toDateTimeLocal(value: string | number) {
  const d = new Date(value)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fromDateTimeLocal(value: string) {
  return value ? new Date(value).getTime() : NaN
}

/**
 * 예상 반환액 — 백엔드 ScoringPolicy 포팅. p = 선택한 선택지의 현재 비율(%), n = 선택지 수.
 * 서버 정산은 가상 시딩 5표를 쓰므로 "예상" 값이다.
 */
export function payout(pct: number, optionCount: number, stake: number) {
  const p = Math.min(1, Math.max(0, pct / 100))
  const c = 1 / optionCount
  const k = 1 / (1 - c) ** 2
  const bonus = 2 * (1 - k * (p - c) ** 2)
  return {
    win: Math.round(((40 * (1 - p) + bonus) * stake) / 100),
    lose: Math.max(0, Math.round(((40 * p - bonus) * stake) / 100)),
  }
}

export type StatusChip = {
  label: string
  /** tailwind 클래스(배경 + 글자색) */
  className: string
}

export const CHIP_CLASS = {
  urgent: "bg-danger-soft text-danger-ink",
  open: "bg-brand-soft text-brand",
  pending: "bg-warn-soft text-warn-ink",
  correct: "bg-brand text-white",
  neutral: "bg-line-3 text-sub",
} as const

/**
 * 이슈 상태 칩. 진행 중 24h 미만 → 카운트다운(빨강), 이상 → D-n, 결과 대기, 확정(적중 +n / 빗나감 / 결과 확정).
 * myOptionId가 없으면 확정 이슈는 "결과 확정".
 */
export function issueChip(
  issue: { status: BackendIssueStatus; voteDeadlineAt: string; correctOptionId: number | null },
  mine: { optionId: number | null | undefined; scoreDelta?: number | null },
  now: Date,
): StatusChip {
  if (issue.status === "CONFIRMED") {
    if (mine.optionId == null) return { label: "결과 확정", className: CHIP_CLASS.neutral }
    if (mine.optionId === issue.correctOptionId) {
      return { label: `적중 +${mine.scoreDelta ?? 0}`, className: CHIP_CLASS.correct }
    }
    return { label: "빗나감", className: CHIP_CLASS.neutral }
  }
  if (issue.status === "PENDING_RESULT") return { label: "결과 대기", className: CHIP_CLASS.pending }
  const ms = Date.parse(issue.voteDeadlineAt) - now.getTime()
  return { label: remainLabel(ms), className: ms < DAY ? CHIP_CLASS.urgent : CHIP_CLASS.open }
}

/** 1초마다 갱신되는 현재 시각. 남은 시간 카운트다운을 새로고침 없이 자동으로 최신화하는 데 쓴다. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

/** 입력값이 멈춘 뒤 delay(ms)가 지나야 바뀌는 값 — 닉네임 중복 확인처럼 서버에 묻는 입력에 쓴다. */
export function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}
