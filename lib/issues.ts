import type { Topic, TopicOption } from "@/lib/api"

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

export type UiIssueStatus = "open" | "voted" | "pending" | "settled"

export type UiIssueOption = {
  id: number
  text: string
  voteCount: number | null
}

export type UiIssue = {
  id: number
  categoryId: number
  question: string
  source: string
  options: UiIssueOption[]
  closesAt: string
  status: UiIssueStatus
  myOptionId?: number
  /** 투표(또는 마감) 후에만 존재하는 비율. optionId -> 0~100 정수. */
  ratio?: Record<number, number>
  totalVotes?: number
  settlement?: {
    /** 내 선택을 모를 때(다른 브라우저에서 투표 등)는 unknown */
    result: "correct" | "wrong" | "unknown"
    correctOptionId?: number
  }
}

function ratioFromOptions(options: { id: number; voteCount: number | null }[]) {
  const total = options.reduce((sum, option) => sum + (option.voteCount ?? 0), 0)
  const ratio: Record<number, number> = {}
  for (const option of options) {
    ratio[option.id] = total === 0 ? 0 : Math.round(((option.voteCount ?? 0) / total) * 100)
  }
  return ratio
}

function toUiOptions(options: TopicOption[]): UiIssueOption[] {
  return options.map((option) => ({ id: option.id, text: option.text, voteCount: option.voteCount }))
}

export function toUiIssue(topic: Topic, localVote?: LocalVote): UiIssue {
  const base = {
    id: topic.id,
    categoryId: topic.categoryId,
    question: topic.title,
    source: topic.description || "관리자 판정 기준",
    options: toUiOptions(topic.options),
    closesAt: topic.voteDeadlineAt,
  }

  if (topic.status === "OPEN") {
    if (localVote) {
      const totalVotes = localVote.liveCounts.reduce((sum, option) => sum + option.voteCount, 0)
      return {
        ...base,
        status: "voted",
        myOptionId: localVote.optionId,
        ratio: ratioFromOptions(localVote.liveCounts),
        totalVotes,
      }
    }
    return { ...base, status: "open" }
  }

  // PENDING_RESULT / CONFIRMED: 서버가 최종 집계를 공개한다
  const ratio = ratioFromOptions(topic.options)
  const totalVotes = topic.options.reduce((sum, option) => sum + (option.voteCount ?? 0), 0)

  if (topic.status === "PENDING_RESULT") {
    return {
      ...base,
      status: "pending",
      myOptionId: localVote?.optionId,
      ratio,
      totalVotes,
    }
  }

  // CONFIRMED
  const result: "correct" | "wrong" | "unknown" = !localVote
    ? "unknown"
    : localVote.optionId === topic.correctOptionId
      ? "correct"
      : "wrong"

  return {
    ...base,
    status: "settled",
    myOptionId: localVote?.optionId,
    ratio,
    totalVotes,
    settlement: { result, correctOptionId: topic.correctOptionId ?? undefined },
  }
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
    ? `${d}일 ${pad(h)}:${pad(m)}`
    : `${pad(h)}:${pad(m)}:${pad(s)} 남음`
}

/** 마감 임박 여부 — 4시간 이내면 액센트 컬러로 표시 */
export function isUrgent(iso: string, now = new Date()) {
  const ms = new Date(iso).getTime() - now.getTime()
  return ms > 0 && ms < 1000 * 60 * 60 * 4
}
