import { request } from "./client"
import type {
  ApiInterface,
  Crew,
  CrewDetail,
  CrewRankingItem,
  CrewTopMember,
  MyCrew,
} from "./types"

const PATHS = {
  list: "/api/crews",
  detail: (crewId: number) => `/api/crews/${crewId}`,
  ranking: "/api/crews/ranking",
  topMembers: (crewId: number) => `/api/crews/${crewId}/top-members`,
  mine: "/api/users/me/crew",
} as const

export const crewApi: ApiInterface["crew"] = {
  list: () => request<Crew[]>({ method: "GET", url: PATHS.list }),
  get: (crewId) =>
    request<CrewDetail>({ method: "GET", url: PATHS.detail(crewId) }),
  ranking: (week) =>
    request<CrewRankingItem[]>({
      method: "GET",
      url: PATHS.ranking,
      params: { week },
    }),
  topMembers: (crewId, week) =>
    request<CrewTopMember[]>({
      method: "GET",
      url: PATHS.topMembers(crewId),
      params: { week },
    }),
  mine: () => request<MyCrew>({ method: "GET", url: PATHS.mine }),
  join: (crewId) =>
    request<MyCrew>({ method: "PUT", url: PATHS.mine, data: { crewId } }),
}
