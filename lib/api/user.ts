import { request } from "./client"
import type { ApiInterface, MyStats, MyVote } from "./types"

const PATHS = {
  stats: (userId: number) => `/api/users/${userId}/stats`,
  votes: (userId: number) => `/api/users/${userId}/votes`,
} as const

export const userApi: ApiInterface["user"] = {
  stats: (userId) => request<MyStats>({ method: "GET", url: PATHS.stats(userId) }),
  votes: (userId) => request<MyVote[]>({ method: "GET", url: PATHS.votes(userId) }),
}
