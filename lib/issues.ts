import type { BackendChoice, TopicDto } from "@/lib/api"

/**
 * 백엔드는 "이 유저가 투표했는지/무엇을 골랐는지"를 목록 조회로 내려주지 않는다
 * (개인별 투표 이력 조회 엔드포인트 자체가 없음). 그래서 이 브라우저에서 실제로
 * 투표에 성공했을 때의 결과만 로컬에 남겨 화면에 반영한다 — 서버 데이터를 대신
 * 지어내는 게 아니라, 서버가 응답으로 내려준 값(liveYesCount/liveNoCount)을 그대로 보관한다.
 */
export type LocalVote = {
  choice: "yes" | "no"
  liveYesCount: number
  liveNoCount: number
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

export function saveLocalVote(userId: number, topicId: number, vote: LocalVote) {
  if (typeof window === "undefined") return
  const votes = loadLocalVotes(userId)
  votes[topicId] = vote
  window.localStorage.setItem(storageKey(userId), JSON.stringify(votes))
}

export function toLocalChoice(choice: BackendChoice): "yes" | "no" {
  return choice === "YES" ? "yes" : "no"
}

export function toBackendChoice(choice: "yes" | "no"): BackendChoice {
  return choice === "yes" ? "YES" : "NO"
}

export type UiIssueStatus = "open" | "voted" | "pending" | "settled"

export type UiIssue = {
  id: number
  categoryId: number
  question: string
  source: string
  labels: { yes: string; no: string }
  closesAt: string
  status: UiIssueStatus
  myChoice?: "yes" | "no"
  /** 투표(또는 마감) 후에만 존재하는 비율. 각 값은 0~100 정수. */
  ratio?: { yes: number; no: number }
  totalVotes?: number
  settlement?: {
    /** 내 선택을 모를 때(다른 브라우저에서 투표 등)는 unknown */
    result: "correct" | "wrong" | "void" | "unknown"
    answer?: "yes" | "no"
  }
}

const DEFAULT_LABELS = { yes: "그렇다", no: "아니다" }

function ratioFromCounts(yes: number, no: number) {
  const total = yes + no
  if (total === 0) return { yes: 0, no: 0 }
  return { yes: Math.round((yes / total) * 100), no: Math.round((no / total) * 100) }
}

export function toUiIssue(topic: TopicDto, localVote?: LocalVote): UiIssue {
  const base = {
    id: topic.id,
    categoryId: topic.categoryId,
    question: topic.title,
    source: topic.description || "관리자 판정 기준",
    labels: DEFAULT_LABELS,
    closesAt: topic.voteDeadlineAt,
  }

  if (topic.status === "OPEN") {
    if (localVote) {
      return {
        ...base,
        status: "voted",
        myChoice: localVote.choice,
        ratio: ratioFromCounts(localVote.liveYesCount, localVote.liveNoCount),
        totalVotes: localVote.liveYesCount + localVote.liveNoCount,
      }
    }
    return { ...base, status: "open" }
  }

  // PENDING_RESULT / CONFIRMED / VOID: 서버가 최종 집계를 공개한다
  const yes = topic.yesCount ?? 0
  const no = topic.noCount ?? 0
  const ratio = ratioFromCounts(yes, no)
  const totalVotes = yes + no

  if (topic.status === "PENDING_RESULT") {
    return { ...base, status: "pending", myChoice: localVote?.choice, ratio, totalVotes }
  }

  // CONFIRMED / VOID
  const answer = topic.correctAnswer ? toLocalChoice(topic.correctAnswer) : undefined
  const result: "correct" | "wrong" | "void" | "unknown" =
    topic.status === "VOID"
      ? "void"
      : !localVote
        ? "unknown"
        : localVote.choice === answer
          ? "correct"
          : "wrong"

  return {
    ...base,
    status: "settled",
    myChoice: localVote?.choice,
    ratio,
    totalVotes,
    settlement: { result, answer },
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
  return d > 0 ? `${d}일 ${pad(h)}:${pad(m)}` : `${pad(h)}:${pad(m)}:${pad(s)}`
}

/** 마감 임박 여부 — 4시간 이내면 액센트 컬러로 표시 */
export function isUrgent(iso: string, now = new Date()) {
  const ms = new Date(iso).getTime() - now.getTime()
  return ms > 0 && ms < 1000 * 60 * 60 * 4
}
