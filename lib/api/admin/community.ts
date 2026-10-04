import { request } from "../client"
import type { AdminCommunityItem, ApiInterface } from "../types"

export const adminCommunityApi: ApiInterface["admin"]["community"] = {
  list: ({ type }) => request<AdminCommunityItem[]>({ method: "GET", url: `/api/admin/${type}` }),

  setHidden: (type, id, hidden) =>
    request<void>({ method: "PATCH", url: `/api/admin/${type}/${id}/hidden`, data: { hidden } }),

  delete: (type, id) => request<void>({ method: "DELETE", url: `/api/admin/${type}/${id}` }),
}
