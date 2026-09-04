// ---- 공통 ----

export interface ApiError {
  statusCode: number
  message: string
}

export type PageResponse<T> = {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// ---- 카테고리 ----

export type Category = {
  id: number
  name: string
}

// ---- 이슈 / 투표 ----

export type BackendIssueStatus = "OPEN" | "PENDING_RESULT" | "CONFIRMED"

export type IssueOption = {
  id: number
  text: string
  /** status === "OPEN" 이면 서버가 null로 감춘다(본인이 투표한 경우는 예외) */
  voteCount: number | null
}

export type Issue = {
  id: number
  categoryId: number
  title: string
  description: string | null
  status: BackendIssueStatus
  voteStartAt: string
  voteDeadlineAt: string
  confirmedAt: string | null
  correctOptionId: number | null
  options: IssueOption[]
  createdAt: string
  /** userId를 실어 조회했고 이 유저가 투표했다면 그 선택지 id. 아니면 null. */
  myOptionId: number | null
  /** 그 투표에 건 신용도. myOptionId가 null이면 함께 null. */
  myStake: number | null
}

export type VoteResult = {
  id: number
  issueId: number
  optionId: number
  stake: number
  /** 이 베팅을 에스크로하고 난 직후의 잔여 신용도 — /api/auth/me를 다시 안 불러도 즉시 반영 가능. */
  remainingCredibility: number
  votedAt: string
  liveCounts: IssueOption[]
}

export type CastVoteReq = {
  userId: number
  optionId: number
  /** 이 선택지에 걸 신용도. 최소 1, 보유 잔액(Me.credibilityScore) 이하만 허용된다. */
  stake: number
}

// ---- 댓글(이슈 상세 + 게시판 공용) ----

export type Reply = {
  id: number
  authorId: number
  authorNickname: string
  content: string
  createdAt: string
}

// ---- 자유 게시판 ----

export type PostListItem = {
  id: number
  authorNickname: string
  title: string
  viewCount: number
  replyCount: number
  createdAt: string
}

export type PostDetail = {
  id: number
  authorId: number
  authorNickname: string
  title: string
  content: string
  viewCount: number
  createdAt: string
}

export type CreatePostReq = {
  title: string
  content: string
}

export type PostListParams = {
  keyword?: string
  page?: number
  size?: number
}

// ---- 인증 / 유저 ----

export type BackendRole = "USER" | "ADMIN"

export type Me = {
  userId: number
  nickname: string
  credibilityScore: number
  tier: string
  role: BackendRole
}

export type MyStats = {
  totalVotes: number
  correctCount: number
  gradedCount: number
}

export type SettlementResult = "CORRECT" | "INCORRECT"

export type MyVote = {
  voteId: number
  issueId: number
  categoryId: number
  categoryName: string
  title: string
  status: BackendIssueStatus
  optionId: number
  optionText: string
  stake: number
  votedAt: string
  voteDeadlineAt: string
  confirmedAt: string | null
  correctOptionId: number | null
  options: IssueOption[]
  result: SettlementResult | null
  scoreDelta: number | null
}

// ---- 관리자: 이슈 ----

export type AdminIssueListItem = {
  id: number
  categoryId: number
  categoryName: string
  title: string
  status: BackendIssueStatus
  voteStartAt: string
  voteDeadlineAt: string
  options: IssueOption[]
  totalVotes: number
}

export type AdminIssueDetail = {
  id: number
  categoryId: number
  categoryName: string
  title: string
  description: string | null
  status: BackendIssueStatus
  voteStartAt: string
  voteDeadlineAt: string
  confirmedAt: string | null
  confirmedByUserId: number | null
  confirmedByNickname: string | null
  correctOptionId: number | null
  options: IssueOption[]
  totalVotes: number
  canFullEdit: boolean
  canExtendDeadline: boolean
  createdAt: string
}

export type IssueUpsertPayload = {
  categoryId: number
  title: string
  description: string | null
  voteStartAt: string
  voteDeadlineAt: string
  /** 선택지 텍스트 목록. 최소 2개. */
  options: string[]
}

export type AdminIssueListParams = {
  categoryId?: number
  status?: BackendIssueStatus
  keyword?: string
  page?: number
  size?: number
}

// ---- 관리자: 유저 ----

export type AdminUserListItem = {
  id: number
  nickname: string
  tier: string
  credibilityScore: number
  role: BackendRole
  createdAt: string
}

export type AdminUserDetail = AdminUserListItem & {
  activitySuppressed: boolean
  totalVotes: number
  correctCount: number
  gradedCount: number
}

export type AdminUserListParams = {
  keyword?: string
  role?: BackendRole
  tier?: string
  page?: number
  size?: number
}

// ---- API 계약 ----
//
// predict 백엔드는 statusCode 봉투가 아니라 실제 HTTP 상태코드를 쓰고, 성공 응답은
// DTO를 봉투 없이 그대로 내려준다(SecurityConfig.java 참고 — "지인 베타" 단계라 API는
// 개방하되 role=admin 게이팅만 서비스 레이어에서 건다). 이 계약과 봉투 해제/에러 정규화는
// client.ts 한 곳에만 있고, 아래 인터페이스와 각 네임스페이스 구현은 그 결과 타입만 안다.
//
// auth 네임스페이스에 login/logout이 없는 이유: predict는 카카오 OAuth 리다이렉트로
// 로그인하고(서버가 302로 /auth/callback?token=... 보냄) 로그아웃은 서버 세션 무효화
// API가 없어 클라이언트에서 토큰만 지운다 — 둘 다 axios로 부를 API 호출이 아니다.
export interface ApiInterface {
  category: {
    list(): Promise<Category[]>
  }
  issue: {
    /** userId를 넘기면 이 유저가 투표한 이슈는 status가 OPEN이어도 실시간 득표수/myOptionId를 함께 받는다. */
    list(userId?: number): Promise<Issue[]>
    get(issueId: number, userId?: number): Promise<Issue>
    vote(issueId: number, req: CastVoteReq): Promise<VoteResult>
    replies: {
      list(issueId: number): Promise<Reply[]>
      create(issueId: number, content: string): Promise<Reply>
      delete(issueId: number, replyId: number): Promise<void>
    }
  }
  post: {
    list(params?: PostListParams): Promise<PageResponse<PostListItem>>
    get(postId: number): Promise<PostDetail>
    create(req: CreatePostReq): Promise<PostDetail>
    delete(postId: number): Promise<void>
    replies: {
      list(postId: number): Promise<Reply[]>
      create(postId: number, content: string): Promise<Reply>
      delete(postId: number, replyId: number): Promise<void>
    }
  }
  auth: {
    me(): Promise<Me>
  }
  user: {
    stats(userId: number): Promise<MyStats>
    votes(userId: number): Promise<MyVote[]>
  }
  admin: {
    issue: {
      list(params: AdminIssueListParams): Promise<PageResponse<AdminIssueListItem>>
      get(issueId: number): Promise<AdminIssueDetail>
      create(payload: IssueUpsertPayload): Promise<AdminIssueDetail>
      update(issueId: number, payload: IssueUpsertPayload): Promise<AdminIssueDetail>
      extendDeadline(issueId: number, newDeadline: string): Promise<AdminIssueDetail>
      confirm(issueId: number, correctOptionId: number): Promise<AdminIssueDetail>
      correct(issueId: number): Promise<AdminIssueDetail>
    }
    user: {
      list(params: AdminUserListParams): Promise<PageResponse<AdminUserListItem>>
      get(userId: number): Promise<AdminUserDetail>
    }
  }
}
