import { getApiBaseUrl, getSessionToken } from "@/lib/auth"

export type BackendTopicStatus = "OPEN" | "PENDING_RESULT" | "CONFIRMED"

export type TopicOption = {
  id: number
  text: string
  /** status === "OPEN" 이면 서버가 null로 감춘다 */
  voteCount: number | null
}

export type Category = {
  id: number
  name: string
}

export type Topic = {
  id: number
  categoryId: number
  title: string
  description: string | null
  status: BackendTopicStatus
  voteStartAt: string
  voteDeadlineAt: string
  confirmedAt: string | null
  correctOptionId: number | null
  options: TopicOption[]
  createdAt: string
  /** userId를 실어 조회했고 이 유저가 투표했다면 그 선택지 id. 아니면 null. */
  myOptionId: number | null
}

export type VoteResult = {
  id: number
  topicId: number
  optionId: number
  votedAt: string
  liveCounts: TopicOption[]
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
  return apiFetch<Category[]>("/api/categories")
}

/**
 * userId를 넘기면 이 유저가 투표한 주제는 status가 OPEN이어도 서버가 실시간 득표수와
 * myOptionId를 함께 내려준다("투표 완료 직후 본인 노출" 정책, docs/predict.md 2-6절).
 */
export function fetchTopics(userId?: number) {
  return apiFetch<Topic[]>(`/api/topics${buildQuery({ userId })}`)
}

export function fetchTopic(topicId: number, userId?: number) {
  return apiFetch<Topic>(`/api/topics/${topicId}${buildQuery({ userId })}`)
}

export function castVote(topicId: number, userId: number, optionId: number) {
  return apiFetch<VoteResult>(`/api/topics/${topicId}/votes`, {
    method: "POST",
    body: JSON.stringify({ userId, optionId }),
  })
}

// ---- 마이페이지 ----

export type MyStats = {
  totalVotes: number
  correctCount: number
  gradedCount: number
}

export type SettlementResult = "CORRECT" | "INCORRECT"

export type MyVote = {
  voteId: number
  topicId: number
  categoryId: number
  categoryName: string
  title: string
  status: BackendTopicStatus
  optionId: number
  optionText: string
  votedAt: string
  voteDeadlineAt: string
  confirmedAt: string | null
  correctOptionId: number | null
  options: TopicOption[]
  result: SettlementResult | null
  scoreDelta: number | null
}

export function fetchMyStats(userId: number) {
  return apiFetch<MyStats>(`/api/users/${userId}/stats`)
}

export function fetchMyVotes(userId: number) {
  return apiFetch<MyVote[]>(`/api/users/${userId}/votes`)
}

// ---- 관리자 페이지 ----

export type PageResponse<T> = {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type AdminTopicListItem = {
  id: number
  categoryId: number
  categoryName: string
  title: string
  status: BackendTopicStatus
  voteStartAt: string
  voteDeadlineAt: string
  options: TopicOption[]
  totalVotes: number
}

export type AdminTopicDetail = {
  id: number
  categoryId: number
  categoryName: string
  title: string
  description: string | null
  status: BackendTopicStatus
  voteStartAt: string
  voteDeadlineAt: string
  confirmedAt: string | null
  confirmedByUserId: number | null
  confirmedByNickname: string | null
  correctOptionId: number | null
  options: TopicOption[]
  totalVotes: number
  canFullEdit: boolean
  canExtendDeadline: boolean
  createdAt: string
}

export type TopicUpsertPayload = {
  categoryId: number
  title: string
  description: string | null
  voteStartAt: string
  voteDeadlineAt: string
  /** 선택지 텍스트 목록. 최소 2개. */
  options: string[]
}

export type BackendRole = "USER" | "ADMIN"

export type AdminUserListItem = {
  id: number
  nickname: string
  tier: string
  credibilityScore: number
  role: BackendRole
  createdAt: string
}

export type AdminUserDetail = AdminUserListItem & {
  activitySuppressed: boolean
  totalVotes: number
  correctCount: number
  gradedCount: number
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value))
  }
  const qs = query.toString()
  return qs ? `?${qs}` : ""
}

export function fetchAdminTopics(params: {
  categoryId?: number
  status?: BackendTopicStatus
  keyword?: string
  page?: number
  size?: number
}) {
  return apiFetch<PageResponse<AdminTopicListItem>>(`/api/admin/topics${buildQuery(params)}`)
}

export function fetchAdminTopicDetail(topicId: number) {
  return apiFetch<AdminTopicDetail>(`/api/admin/topics/${topicId}`)
}

export function createTopic(payload: TopicUpsertPayload) {
  return apiFetch<AdminTopicDetail>("/api/admin/topics", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updateTopic(topicId: number, payload: TopicUpsertPayload) {
  return apiFetch<AdminTopicDetail>(`/api/admin/topics/${topicId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export function extendTopicDeadline(topicId: number, newDeadline: string) {
  return apiFetch<AdminTopicDetail>(`/api/admin/topics/${topicId}/extend-deadline`, {
    method: "POST",
    body: JSON.stringify({ newDeadline }),
  })
}

export function confirmTopicResult(topicId: number, correctOptionId: number) {
  return apiFetch<AdminTopicDetail>(`/api/admin/topics/${topicId}/confirm`, {
    method: "POST",
    body: JSON.stringify({ correctOptionId }),
  })
}

export function correctTopicResult(topicId: number) {
  return apiFetch<AdminTopicDetail>(`/api/admin/topics/${topicId}/correct`, {
    method: "POST",
  })
}

export function fetchAdminUsers(params: {
  keyword?: string
  role?: BackendRole
  tier?: string
  page?: number
  size?: number
}) {
  return apiFetch<PageResponse<AdminUserListItem>>(`/api/admin/users${buildQuery(params)}`)
}

export function fetchAdminUserDetail(userId: number) {
  return apiFetch<AdminUserDetail>(`/api/admin/users/${userId}`)
}
