import { getApiBaseUrl, getSessionToken } from "@/lib/auth"

export type BackendChoice = "YES" | "NO"
export type BackendTopicStatus = "OPEN" | "PENDING_RESULT" | "CONFIRMED" | "VOID"

export type CategoryDto = {
  id: number
  name: string
}

export type TopicDto = {
  id: number
  categoryId: number
  title: string
  description: string | null
  status: BackendTopicStatus
  voteStartAt: string
  voteDeadlineAt: string
  confirmedAt: string | null
  correctAnswer: BackendChoice | null
  /** status === "OPEN" 이면 서버가 null로 감춘다 */
  yesCount: number | null
  noCount: number | null
  createdAt: string
}

export type VoteResultDto = {
  id: number
  topicId: number
  choice: BackendChoice
  votedAt: string
  liveYesCount: number
  liveNoCount: number
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getSessionToken()
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null
    throw new ApiError(res.status, body?.message ?? `요청에 실패했습니다 (${res.status})`)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export function fetchCategories() {
  return apiFetch<CategoryDto[]>("/api/categories")
}

export function fetchTopics() {
  return apiFetch<TopicDto[]>("/api/topics")
}

export function castVote(topicId: number, userId: number, choice: BackendChoice) {
  return apiFetch<VoteResultDto>(`/api/topics/${topicId}/votes`, {
    method: "POST",
    body: JSON.stringify({ userId, choice }),
  })
}
