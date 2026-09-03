import { useEffect, useRef, useState } from "react"

import type { Topic } from "@/lib/api"

export type IssueStatus = "open" | "voted" | "pending" | "settled"

/**
 * 백엔드 상태(topic.status) + 내 투표 여부(topic.myOptionId, 서버가 userId로 조회했을 때만 채워짐)를
 * 화면에 필요한 4단계 상태로 정리한다.
 */
export function issueStatus(topic: Topic): IssueStatus {
  if (topic.status === "OPEN") return topic.myOptionId != null ? "voted" : "open"
  if (topic.status === "PENDING_RESULT") return "pending"
  return "settled"
}

/** optionId -> 0~100 정수 비율. topic.options의 voteCount(서버가 감췄다면 null)를 그대로 쓴다. */
export function voteRatio(options: { id: number; voteCount: number | null }[]) {
  const total = options.reduce((sum, o) => sum + (o.voteCount ?? 0), 0)
  const ratio: Record<number, number> = {}
  for (const o of options) {
    ratio[o.id] = total === 0 ? 0 : Math.round(((o.voteCount ?? 0) / total) * 100)
  }
  return ratio
}

export function totalVoteCount(options: { voteCount: number | null }[]) {
  return options.reduce((sum, o) => sum + (o.voteCount ?? 0), 0)
}

/** 확정(CONFIRMED)된 주제에서 내 선택이 정답이었는지. 내 선택을 모르면(비로그인 등) unknown. */
export function settlementResult(topic: Topic): "correct" | "wrong" | "unknown" {
  if (topic.myOptionId == null) return "unknown"
  return topic.myOptionId === topic.correctOptionId ? "correct" : "wrong"
}

/**
 * intervalMs마다 callback을 반복 호출한다. enabled가 false면 멈춘다.
 * 다른 사람의 투표를 실시간에 가깝게 반영하기 위해 서버를 주기적으로 다시 조회하는 용도.
 */
export function usePolling(
  callback: () => void,
  intervalMs: number,
  enabled: boolean,
) {
  const callbackRef = useRef(callback)
  useEffect(() => {
    callbackRef.current = callback
  })

  useEffect(() => {
    if (!enabled) return
    const id = setInterval(() => callbackRef.current(), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs, enabled])
}

export function formatRemaining(iso: string, now = new Date()) {
  const ms = new Date(iso).getTime() - now.getTime()
  if (ms <= 0) return "마감"
  const total = Math.floor(ms / 1000)
  const d = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  return d > 0
    ? `${d}일 ${pad(h)}:${pad(m)} 남음`
    : `${pad(h)}:${pad(m)}:${pad(s)} 남음`
}

/** 마감 임박 여부 — 4시간 이내면 액센트 컬러로 표시 */
export function isUrgent(iso: string, now = new Date()) {
  const ms = new Date(iso).getTime() - now.getTime()
  return ms > 0 && ms < 1000 * 60 * 60 * 4
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
