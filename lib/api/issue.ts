import { request } from "./client"
import type { ApiInterface, CastVoteReq, Issue, Reply, VoteResult } from "./types"

const PATHS = {
  list: "/api/issues",
  detail: (issueId: number) => `/api/issues/${issueId}`,
  votes: (issueId: number) => `/api/issues/${issueId}/votes`,
  myVote: (issueId: number) => `/api/issues/${issueId}/votes/me`,
  replies: (issueId: number) => `/api/issues/${issueId}/replies`,
  reply: (issueId: number, replyId: number) => `/api/issues/${issueId}/replies/${replyId}`,
  replyLike: (issueId: number, replyId: number) => `/api/issues/${issueId}/replies/${replyId}/like`,
  replyReports: (issueId: number, replyId: number) => `/api/issues/${issueId}/replies/${replyId}/reports`,
} as const

export const issueApi: ApiInterface["issue"] = {
  list: (userId) => request<Issue[]>({ method: "GET", url: PATHS.list, params: { userId } }),

  get: (issueId, userId) =>
    request<Issue>({ method: "GET", url: PATHS.detail(issueId), params: { userId } }),

  vote: (issueId, req: CastVoteReq) =>
    request<VoteResult>({ method: "POST", url: PATHS.votes(issueId), data: req }),

  changeVote: async (issueId, optionId) => {
    await request<VoteResult>({ method: "PUT", url: PATHS.myVote(issueId), data: { optionId } })
  },

  replies: {
    list: (issueId) => request<Reply[]>({ method: "GET", url: PATHS.replies(issueId) }),

    create: (issueId, content) =>
      request<Reply>({ method: "POST", url: PATHS.replies(issueId), data: { content } }),

    delete: (issueId, replyId) =>
      request<void>({ method: "DELETE", url: PATHS.reply(issueId, replyId) }),

    like: async (issueId, replyId) => {
      await request({ method: "POST", url: PATHS.replyLike(issueId, replyId) })
    },

    report: (issueId, replyId, reason) =>
      request<void>({ method: "POST", url: PATHS.replyReports(issueId, replyId), data: { reason } }),
  },
}
