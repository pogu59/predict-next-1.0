import type { AdminIssueListParams, AdminUserListParams, PostListParams } from "@/lib/api"

/**
 * 쿼리 키를 여기 한 곳에 모아둔다 — invalidateQueries가 여기저기 흩어진 문자열 배열을
 * 다시 손으로 맞추다 오타로 캐시를 못 지우는 실수를 막는 목적. 훅은 항상 이 팩토리를 통해서만
 * 키를 만든다.
 */
export const queryKeys = {
  categories: ["categories"] as const,
  me: ["me"] as const,

  issues: (userId?: number) => ["issues", userId] as const,
  issue: (issueId: number, userId?: number) => ["issue", issueId, userId] as const,
  issueReplies: (issueId: number) => ["issue", issueId, "replies"] as const,

  posts: (params?: PostListParams) => ["posts", params] as const,
  post: (postId: number) => ["post", postId] as const,
  postReplies: (postId: number) => ["post", postId, "replies"] as const,

  myStats: (userId: number) => ["myStats", userId] as const,
  myVotes: (userId: number) => ["myVotes", userId] as const,

  adminIssues: (params: AdminIssueListParams) => ["admin", "issues", params] as const,
  adminIssue: (issueId: number) => ["admin", "issue", issueId] as const,
  adminUsers: (params: AdminUserListParams) => ["admin", "users", params] as const,
  adminUser: (userId: number) => ["admin", "user", userId] as const,
}
