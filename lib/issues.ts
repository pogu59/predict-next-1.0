import { useEffect, useState } from "react"

import type { Topic } from "@/lib/api"

/**
 * 이슈 목록(GET /api/topics)은 "이 유저가 투표했는지/무엇을 골랐는지"를 함께 내려주지 않는다.
 * 개인별 투표 이력은 /api/users/{id}/votes(마이페이지 전용)로 따로 조회해야 하는데,
 * 이슈 목록 화면에서 매번 이 호출을 추가로 하는 대신 이 브라우저에서 실제로 투표에
 * 성공했을 때의 결과만 로컬에 남겨 화면에 반영한다 — 서버 데이터를 대신 지어내는 게
 * 아니라, 서버가 응답으로 내려준 값(liveCounts)을 그대로 보관한다.
 */
export type LocalVote = {
  optionId: number
  liveCounts: { id: number; voteCount: number }[]
}

function storageKey(userId: number) {
  return `predict_votes_${userId}`
}

export function loadLocalVotes(userId: number): Record<number, LocalVote> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveLocalVote(
  userId: number,
  topicId: number,
  vote: LocalVote,
) {
  if (typeof window === "undefined") return
  const votes = loadLocalVotes(userId)
  votes[topicId] = vote
  window.localStorage.setItem(storageKey(userId), JSON.stringify(votes))
}

export type IssueStatus = "open" | "voted" | "pending" | "settled"

/** 백엔드 상태(topic.status) + 로컬 투표 여부를 화면에 필요한 4단계 상태로 정리한다. */
export function issueStatus(topic: Topic, localVote?: LocalVote): IssueStatus {
  if (topic.status === "OPEN") return localVote ? "voted" : "open"
  if (topic.status === "PENDING_RESULT") return "pending"
  return "settled"
}

/**
 * 비율 계산에 쓸 득표수 소스. OPEN 상태에서는 서버가 voteCount를 null로 감추므로,
 * 방금 투표해서 로컬에 응답이 있으면 그걸 쓰고, 그 외(집계가 공개된 상태)에는
 * topic.options를 그대로 쓴다.
 */
export function voteCountOptions(
  topic: Topic,
  localVote?: LocalVote,
): { id: number; voteCount: number | null }[] {
  if (topic.status === "OPEN" && localVote) return localVote.liveCounts
  return topic.options
}

/** optionId -> 0~100 정수 비율 */
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

/** 확정(CONFIRMED)된 주제에서 내 선택이 정답이었는지. 내 선택을 모르면(다른 브라우저 등) unknown. */
export function settlementResult(
  topic: Topic,
  localVote?: LocalVote,
): "correct" | "wrong" | "unknown" {
  if (!localVote) return "unknown"
  return localVote.optionId === topic.correctOptionId ? "correct" : "wrong"
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
