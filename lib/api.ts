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

// ---- 마이페이지 ----

export type MyStatsDto = {
  totalVotes: number
  correctCount: number
  gradedCount: number
}

export type SettlementResultDto = "CORRECT" | "INCORRECT" | "VOID"

export type MyVoteDto = {
  voteId: number
  topicId: number
  categoryId: number
  categoryName: string
  title: string
  status: BackendTopicStatus
  choice: BackendChoice
  votedAt: string
  voteDeadlineAt: string
  confirmedAt: string | null
  correctAnswer: BackendChoice | null
  yesCount: number | null
  noCount: number | null
  result: SettlementResultDto | null
  scoreDelta: number | null
}

export function fetchMyStats(userId: number) {
  return apiFetch<MyStatsDto>(`/api/users/${userId}/stats`)
}

export function fetchMyVotes(userId: number) {
  return apiFetch<MyVoteDto[]>(`/api/users/${userId}/votes`)
}

// ---- 관리자 페이지 ----

export type PageResponse<T> = {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type AdminTopicListItemDto = {
  id: number
  categoryId: number
  categoryName: string
  title: string
  status: BackendTopicStatus
  voteStartAt: string
  voteDeadlineAt: string
  yesCount: number
  noCount: number
  totalVotes: number
}

export type AdminTopicDetailDto = {
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
  correctAnswer: BackendChoice | null
  yesCount: number
  noCount: number
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
}

export type BackendRole = "USER" | "ADMIN"

export type AdminUserListItemDto = {
  id: number
  nickname: string
  tier: string
  credibilityScore: number
  role: BackendRole
  createdAt: string
}

export type AdminUserDetailDto = AdminUserListItemDto & {
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
  return apiFetch<PageResponse<AdminTopicListItemDto>>(`/api/admin/topics${buildQuery(params)}`)
}

export function fetchAdminTopicDetail(topicId: number) {
  return apiFetch<AdminTopicDetailDto>(`/api/admin/topics/${topicId}`)
}

export function createTopic(payload: TopicUpsertPayload) {
  return apiFetch<AdminTopicDetailDto>("/api/admin/topics", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updateTopic(topicId: number, payload: TopicUpsertPayload) {
  return apiFetch<AdminTopicDetailDto>(`/api/admin/topics/${topicId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export function extendTopicDeadline(topicId: number, newDeadline: string) {
  return apiFetch<AdminTopicDetailDto>(`/api/admin/topics/${topicId}/extend-deadline`, {
    method: "POST",
    body: JSON.stringify({ newDeadline }),
  })
}

/** correctAnswer가 null이면 무효 처리로 취급된다. */
export function confirmTopicResult(topicId: number, correctAnswer: BackendChoice | null) {
  return apiFetch<AdminTopicDetailDto>(`/api/admin/topics/${topicId}/confirm`, {
    method: "POST",
    body: JSON.stringify({ correctAnswer }),
  })
}

export function correctTopicResult(topicId: number) {
  return apiFetch<AdminTopicDetailDto>(`/api/admin/topics/${topicId}/correct`, {
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
  return apiFetch<PageResponse<AdminUserListItemDto>>(`/api/admin/users${buildQuery(params)}`)
}

export function fetchAdminUserDetail(userId: number) {
  return apiFetch<AdminUserDetailDto>(`/api/admin/users/${userId}`)
}
