import { request } from "../client"
import type { AdminMissionListItem, ApiInterface } from "../types"

export const adminMissionApi: ApiInterface["admin"]["mission"] = {
  list: () =>
    request<AdminMissionListItem[]>({
      method: "GET",
      url: "/api/admin/missions",
    }),

  // openNow가 true면 만들자마자 공개한다(문항 없는 설문·밸런스는 서버가 409로 거절).
  create: (req) =>
    request<AdminMissionListItem>({
      method: "POST",
      url: "/api/admin/missions",
      data: req,
    }),

  open: (missionId) =>
    request<AdminMissionListItem>({
      method: "POST",
      url: `/api/admin/missions/${missionId}/open`,
    }),

  close: (missionId) =>
    request<AdminMissionListItem>({
      method: "POST",
      url: `/api/admin/missions/${missionId}/close`,
    }),
}
