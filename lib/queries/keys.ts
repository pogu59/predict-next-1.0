import type {
  AdminIssueListParams,
  AdminUserListParams,
  CommunityContentType,
  PostListParams,
} from "@/lib/api"

/**
 * 쿼리 키를 여기 한 곳에 모아둔다 — invalidateQueries가 여기저기 흩어진 문자열 배열을
 * 다시 손으로 맞추다 오타로 캐시를 못 지우는 실수를 막는 목적. 훅은 항상 이 팩토리를 통해서만
 * 키를 만든다.
 */
export const queryKeys = {
  categories: ["categories"] as const,
  me: ["me"] as const,
  nickname: (nickname: string) => ["nickname", nickname] as const,

  issues: (userId?: number) => ["issues", userId] as const,
  /** "issues" 접두어라 투표·관리자 변경 후 ["issues"] 무효화에 같이 걸린다. */
  liveCount: ["issues", "live-count"] as const,
  issue: (issueId: number, userId?: number) => ["issue", issueId, userId] as const,
  issueReplies: (issueId: number) => ["issue", issueId, "replies"] as const,

  posts: (params?: PostListParams) => ["posts", params] as const,
  post: (postId: number) => ["post", postId] as const,
  postReplies: (postId: number) => ["post", postId, "replies"] as const,

  myStats: (userId: number) => ["myStats", userId] as const,
  myVotes: (userId: number) => ["myVotes", userId] as const,

  crews: ["crews"] as const,
  crew: (crewId: number) => ["crew", crewId] as const,
  crewRanking: (week?: string) => ["crews", "ranking", week ?? "this"] as const,
  crewTopMembers: (crewId: number, week?: string) => ["crew", crewId, "top", week ?? "this"] as const,
  myCrew: (userId: number) => ["myCrew", userId] as const,

  adminIssues: (params: AdminIssueListParams) => ["admin", "issues", params] as const,
  adminIssue: (issueId: number) => ["admin", "issue", issueId] as const,
  adminUsers: (params: AdminUserListParams) => ["admin", "users", params] as const,
  adminUser: (userId: number) => ["admin", "user", userId] as const,
  adminCommunity: (type: CommunityContentType) => ["admin", "community", type] as const,
  adminReports: (status: "PENDING" | "DONE") => ["admin", "reports", status] as const,
  adminCrews: ["admin", "crews"] as const,
}
