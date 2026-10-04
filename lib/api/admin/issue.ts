import { request } from "../client"
import type {
  AdminIssueDetail,
  AdminIssueListItem,
  AdminIssueListParams,
  ApiInterface,
  IssueUpsertPayload,
  PageResponse,
} from "../types"

const PATHS = {
  list: "/api/admin/issues",
  detail: (issueId: number) => `/api/admin/issues/${issueId}`,
  extendDeadline: (issueId: number) => `/api/admin/issues/${issueId}/extend-deadline`,
  confirm: (issueId: number) => `/api/admin/issues/${issueId}/confirm`,
  correct: (issueId: number) => `/api/admin/issues/${issueId}/correct`,
} as const

export const adminIssueApi: ApiInterface["admin"]["issue"] = {
  list: (params: AdminIssueListParams) =>
    request<PageResponse<AdminIssueListItem>>({ method: "GET", url: PATHS.list, params }),

  get: (issueId) => request<AdminIssueDetail>({ method: "GET", url: PATHS.detail(issueId) }),

  // categoryId를 비우면 서버가 기본 카테고리에 넣는다(UI에서 카테고리를 없앴다).
  create: (payload: IssueUpsertPayload) =>
    request<AdminIssueDetail>({ method: "POST", url: PATHS.list, data: payload }),

  update: (issueId, payload: IssueUpsertPayload) =>
    request<AdminIssueDetail>({ method: "PUT", url: PATHS.detail(issueId), data: payload }),

  extendDeadline: (issueId, newDeadline) =>
    request<AdminIssueDetail>({
      method: "POST",
      url: PATHS.extendDeadline(issueId),
      data: { newDeadline },
    }),

  confirm: (issueId, correctOptionId) =>
    request<AdminIssueDetail>({
      method: "POST",
      url: PATHS.confirm(issueId),
      data: { correctOptionId },
    }),

  correct: (issueId) => request<AdminIssueDetail>({ method: "POST", url: PATHS.correct(issueId) }),

  delete: (issueId) => request<void>({ method: "DELETE", url: PATHS.detail(issueId) }),
}
