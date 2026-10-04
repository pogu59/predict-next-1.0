import { request } from "../client"
import type { AdminCrew, ApiInterface } from "../types"

const PATHS = {
  list: "/api/admin/crews",
  detail: (crewId: number) => `/api/admin/crews/${crewId}`,
} as const

export const adminCrewApi: ApiInterface["admin"]["crew"] = {
  list: () => request<AdminCrew[]>({ method: "GET", url: PATHS.list }),
  create: (payload) =>
    request<AdminCrew>({ method: "POST", url: PATHS.list, data: payload }),
  update: (crewId, payload) =>
    request<AdminCrew>({
      method: "PUT",
      url: PATHS.detail(crewId),
      data: payload,
    }),
}
