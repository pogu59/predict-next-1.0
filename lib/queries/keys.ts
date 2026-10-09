import type {
  AdminIssueListParams,
  AdminUserListParams,
  CommunityContentType,
  ExchangeStatus,
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

  /** 미션 목록·상세는 로그인 여부에 따라 myStatus가 달라서 userId를 키에 넣는다. */
  missions: (userId?: number) => ["missions", userId] as const,
  mission: (missionId: number, userId?: number) => ["mission", missionId, userId] as const,
  missionResults: (missionId: number) => ["missionResults", missionId] as const,
  /** 리워드 포인트 지갑(잔액·내역·교환). 신용도(me)와 다른 값이라 키도 따로 둔다. */
  wallet: (userId: number) => ["wallet", userId] as const,

  adminIssues: (params: AdminIssueListParams) => ["admin", "issues", params] as const,
  adminIssue: (issueId: number) => ["admin", "issue", issueId] as const,
  adminUsers: (params: AdminUserListParams) => ["admin", "users", params] as const,
  adminUser: (userId: number) => ["admin", "user", userId] as const,
  adminCommunity: (type: CommunityContentType) => ["admin", "community", type] as const,
  adminReports: (status: "PENDING" | "DONE") => ["admin", "reports", status] as const,
  adminMissions: ["admin", "missions"] as const,
  adminExchanges: (status?: ExchangeStatus) => ["admin", "exchanges", status] as const,
}
