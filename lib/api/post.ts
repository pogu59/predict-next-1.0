import { request } from "./client"
import type { ApiInterface, CreatePostReq, PageResponse, PostDetail, PostListItem, PostListParams, Reply } from "./types"

const PATHS = {
  list: "/api/posts",
  detail: (postId: number) => `/api/posts/${postId}`,
  replies: (postId: number) => `/api/posts/${postId}/replies`,
  reply: (postId: number, replyId: number) => `/api/posts/${postId}/replies/${replyId}`,
} as const

export const postApi: ApiInterface["post"] = {
  list: (params?: PostListParams) =>
    request<PageResponse<PostListItem>>({ method: "GET", url: PATHS.list, params }),

  get: (postId) => request<PostDetail>({ method: "GET", url: PATHS.detail(postId) }),

  create: (req: CreatePostReq) =>
    request<PostDetail>({ method: "POST", url: PATHS.list, data: req }),

  delete: (postId) => request<void>({ method: "DELETE", url: PATHS.detail(postId) }),

  replies: {
    list: (postId) => request<Reply[]>({ method: "GET", url: PATHS.replies(postId) }),

    create: (postId, content) =>
      request<Reply>({ method: "POST", url: PATHS.replies(postId), data: { content } }),

    delete: (postId, replyId) =>
      request<void>({ method: "DELETE", url: PATHS.reply(postId, replyId) }),
  },
}
