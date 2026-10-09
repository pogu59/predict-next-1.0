import { request } from "./client"
import type {
  ApiInterface,
  MissionDetail,
  MissionListItem,
  MissionResults,
  SubmitMissionResult,
} from "./types"

const PATHS = {
  list: "/api/missions",
  detail: (missionId: number) => `/api/missions/${missionId}`,
  submit: (missionId: number) => `/api/missions/${missionId}/submissions`,
  results: (missionId: number) => `/api/missions/${missionId}/results`,
} as const

export const missionApi: ApiInterface["mission"] = {
  list: () => request<MissionListItem[]>({ method: "GET", url: PATHS.list }),

  get: (missionId) =>
    request<MissionDetail>({ method: "GET", url: PATHS.detail(missionId) }),

  submit: (missionId, req) =>
    request<SubmitMissionResult>({
      method: "POST",
      url: PATHS.submit(missionId),
      data: req,
    }),

  results: (missionId) =>
    request<MissionResults>({ method: "GET", url: PATHS.results(missionId) }),
}
