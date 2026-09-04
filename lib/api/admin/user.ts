import { request } from "../client"
import type { AdminUserDetail, AdminUserListItem, AdminUserListParams, ApiInterface, PageResponse } from "../types"

const PATHS = {
  list: "/api/admin/users",
  detail: (userId: number) => `/api/admin/users/${userId}`,
} as const

export const adminUserApi: ApiInterface["admin"]["user"] = {
  list: (params: AdminUserListParams) =>
    request<PageResponse<AdminUserListItem>>({ method: "GET", url: PATHS.list, params }),

  get: (userId) => request<AdminUserDetail>({ method: "GET", url: PATHS.detail(userId) }),
}
