import { request } from "./client"
import type {
  ApiInterface,
  CreatePostReq,
  PageResponse,
  PostDetail,
  PostListItem,
  PostListParams,
  Reply,
} from "./types"

const PATHS = {
  list: "/api/posts",
  detail: (postId: number) => `/api/posts/${postId}`,
  like: (postId: number) => `/api/posts/${postId}/like`,
  reports: (postId: number) => `/api/posts/${postId}/reports`,
  hideAuthor: (postId: number) => `/api/posts/${postId}/hide-author`,
  replies: (postId: number) => `/api/posts/${postId}/replies`,
  reply: (postId: number, replyId: number) => `/api/posts/${postId}/replies/${replyId}`,
  replyLike: (postId: number, replyId: number) => `/api/posts/${postId}/replies/${replyId}/like`,
  replyReports: (postId: number, replyId: number) => `/api/posts/${postId}/replies/${replyId}/reports`,
} as const

export const postApi: ApiInterface["post"] = {
  list: (params?: PostListParams) =>
    request<PageResponse<PostListItem>>({ method: "GET", url: PATHS.list, params }),

  get: (postId) => request<PostDetail>({ method: "GET", url: PATHS.detail(postId) }),

  create: (req: CreatePostReq) => request<PostDetail>({ method: "POST", url: PATHS.list, data: req }),

  update: (postId, req) => request<PostDetail>({ method: "PUT", url: PATHS.detail(postId), data: req }),

  delete: (postId) => request<void>({ method: "DELETE", url: PATHS.detail(postId) }),

  like: async (postId) => {
    await request({ method: "POST", url: PATHS.like(postId) })
  },

  report: (postId, reason) => request<void>({ method: "POST", url: PATHS.reports(postId), data: { reason } }),

  hideAuthor: (postId) => request<void>({ method: "POST", url: PATHS.hideAuthor(postId) }),

  replies: {
    list: (postId) => request<Reply[]>({ method: "GET", url: PATHS.replies(postId) }),

    create: (postId, content, parentId) =>
      request<Reply>({ method: "POST", url: PATHS.replies(postId), data: { content, parentId } }),

    delete: (postId, replyId) =>
      request<void>({ method: "DELETE", url: PATHS.reply(postId, replyId) }),

    like: async (postId, replyId) => {
      await request({ method: "POST", url: PATHS.replyLike(postId, replyId) })
    },

    report: (postId, replyId, reason) =>
      request<void>({ method: "POST", url: PATHS.replyReports(postId, replyId), data: { reason } }),
  },
}
