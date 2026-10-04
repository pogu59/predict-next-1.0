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
// UI에서는 카테고리를 쓰지 않는다. 백엔드가 이슈 생성 시 categoryId를 요구해서 타입만 남겨 둔다.

export type Category = {
  id: number
  name: string
}

// ---- 이슈 / 투표 ----

export type BackendIssueStatus = "OPEN" | "PENDING_RESULT" | "CONFIRMED"

export type IssueOption = {
  id: number
  text: string
  /** 참여 인원 비공개 — 서버는 항상 null을 내려준다. 화면에 렌더링하지 않는다. */
  voteCount?: number | null
  /** 0~100 정수 비율. */
  percent?: number
}

export type Issue = {
  id: number
  categoryId?: number
  title: string
  description: string | null
  status: BackendIssueStatus
  voteStartAt: string
  voteDeadlineAt: string
  confirmedAt: string | null
  correctOptionId: number | null
  options: IssueOption[]
  createdAt: string
  /** 관리자가 업로드한 커버 이미지. 없으면 플레이스홀더를 보여준다. */
  coverImageUrl?: string | null
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

export type ReportReason = "스팸·광고" | "욕설·비하" | "음란·선정성" | "개인정보 노출" | "기타"

export type Reply = {
  id: number
  authorId: number
  authorNickname: string
  content: string
  createdAt: string
  likeCount: number
  likedByMe: boolean
  /** 이슈 댓글 전용 — 작성자가 투표했다면 현재 선택지 id. */
  authorOptionId: number | null
  /** 게시판 댓글 전용 — 1단계 대댓글. */
  replies: Reply[]
  /** 작성자의 현재 크루 이름(없으면 null) — 닉네임 옆 배지. */
  authorCrewName?: string | null
}

// ---- 자유 게시판 ----

export type PostSort = "hot" | "new"

export type PostListItem = {
  id: number
  authorNickname: string
  title: string
  /** 본문 첫 줄 미리보기. */
  contentPreview?: string
  thumbnailUrl?: string | null
  likeCount: number
  likedByMe: boolean
  viewCount: number
  replyCount: number
  createdAt: string
  /** 작성자의 현재 크루 이름(없으면 null). */
  authorCrewName?: string | null
}

export type PostDetail = {
  id: number
  authorId: number
  authorNickname: string
  title: string
  content: string
  images: string[]
  likeCount: number
  likedByMe: boolean
  viewCount: number
  createdAt: string
  /** 작성자의 현재 크루 이름(없으면 null). */
  authorCrewName?: string | null
}

export type CreatePostReq = {
  title: string
  content: string
  /** 업로드 API(upload.image)가 돌려준 URL. 최대 4장. */
  images?: string[]
}

export type PostListParams = {
  keyword?: string
  sort?: PostSort
  author?: "me"
  page?: number
  size?: number
}

// ---- 업로드 ----

export type UploadResult = {
  url: string
}

// ---- 인증 / 유저 ----

export type BackendRole = "USER" | "ADMIN"

export type SocialProvider = "kakao" | "google" | "apple"

export type Me = {
  userId: number
  nickname: string
  credibilityScore: number
  tier: string
  role: BackendRole
}

export type TermsAgreement = {
  age: boolean
  service: boolean
  privacy: boolean
  marketing: boolean
}

export type EmailSignupReq = {
  email: string
  password: string
  nickname: string
  terms: TermsAgreement
}

export type EmailLoginReq = {
  email: string
  password: string
}

export type AuthTokenResult = {
  token: string
}

export type SocialSignupReq = {
  via: SocialProvider
  nickname: string
  terms: TermsAgreement
}

export type NicknameCheckResult = {
  available: boolean
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
  coverImageUrl?: string | null
  result: SettlementResult | null
  scoreDelta: number | null
}

// ---- 관리자: 이슈 ----

export type AdminIssueListItem = {
  id: number
  title: string
  status: BackendIssueStatus
  voteStartAt: string
  voteDeadlineAt: string
  correctOptionId?: number | null
  coverImageUrl?: string | null
  options: IssueOption[]
}

export type AdminIssueDetail = {
  id: number
  categoryId?: number
  title: string
  description: string | null
  status: BackendIssueStatus
  voteStartAt: string
  voteDeadlineAt: string
  confirmedAt: string | null
  confirmedByUserId: number | null
  confirmedByNickname: string | null
  correctOptionId: number | null
  coverImageUrl?: string | null
  options: IssueOption[]
  canFullEdit: boolean
  canExtendDeadline: boolean
  createdAt: string
}

export type IssueUpsertPayload = {
  /** UI에서 카테고리를 없앴다 — 비우면 서버가 기본 카테고리에 넣는다. */
  categoryId?: number
  title: string
  description: string | null
  voteStartAt: string
  voteDeadlineAt: string
  coverImageUrl?: string
  /** 선택지 텍스트 목록. 최소 2개, 최대 6개. */
  options: string[]
}

export type AdminIssueListParams = {
  status?: BackendIssueStatus
  keyword?: string
  page?: number
  size?: number
}

// ---- 관리자: 유저 ----

export type AdminUserListItem = {
  id: number
  nickname: string
  email?: string | null
  /** 가입 경로(users.signup_channel). */
  via?: SocialProvider | "email" | null
  tier: string
  credibilityScore: number
  role: BackendRole
  suspended: boolean
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

// ---- 관리자: 커뮤니티 / 신고 ----

export type CommunityContentType = "posts" | "comments"

export type AdminCommunityItem = {
  id: number
  /** 게시글 댓글이면 소속 게시글 id(삭제 시 필요). */
  postId?: number
  authorNickname: string
  /** 게시글은 제목, 댓글은 본문. */
  title: string
  /** 댓글 전용 — "게시글 · 제목" 같은 위치 설명. */
  where?: string
  likeCount: number
  replyCount?: number
  reportCount: number
  hidden: boolean
  createdAt: string
}

export type ReportStatus = "PENDING" | "REJECTED" | "REMOVED"

export type AdminReport = {
  id: number
  kind: "post" | "comment"
  targetId: number
  /** 신고 대상이 댓글이면 소속(이슈/게시글). */
  parent?: { type: "issue" | "post"; id: number }
  authorNickname: string
  excerpt: string
  reason: ReportReason
  count: number
  status: ReportStatus
  createdAt: string
}

// ---- API 계약 ----
//
// predict 백엔드는 statusCode 봉투가 아니라 실제 HTTP 상태코드를 쓰고, 성공 응답은
// DTO를 봉투 없이 그대로 내려준다. 이 계약과 봉투 해제/에러 정규화는 client.ts 한 곳에만 있고,
// 아래 인터페이스와 각 네임스페이스 구현은 그 결과 타입만 안다.
//
// ---- 크루 대항전 (predict-spring-1.0 CrewController / MyCrewController / AdminCrewController) ----

export type Crew = {
  id: number
  name: string
  slug: string
  description: string | null
  memberCount: number
}

/** 한 주의 크루 성적. rank가 null이면 집계 중(활성 멤버 5명 미만). scorePerMember는 소수 둘째 자리까지. */
export type CrewWeek = {
  weekStart: string
  rank: number | null
  scorePerMember: number
  activeMembers: number
}

export type CrewDetail = Crew & { thisWeek: CrewWeek }

export type CrewRankingItem = {
  rank: number | null
  crewId: number
  name: string
  scorePerMember: number
  activeMembers: number
  memberCount: number
}

export type CrewTopMember = {
  nickname: string
  tier: string
  scoreGain: number
}

/** 가입 전이면 crew·joinedAt·nextChangeAt이 null. weekSettlements가 3 이상이면 이번 주 활성 멤버. */
export type MyCrew = {
  crew: Crew | null
  joinedAt: string | null
  nextChangeAt: string | null
  weekScoreGain: number
  weekSettlements: number
}

export type AdminCrew = {
  id: number
  name: string
  slug: string
  description: string | null
  active: boolean
  memberCount: number
  createdAt: string
}

/** slug를 비우면 서버가 이름으로 만든다. */
export type AdminCrewPayload = {
  name: string
  slug?: string
  description?: string
  active: boolean
}

// 모든 엔드포인트는 predict-spring-1.0 백엔드에 구현되어 있다.
export interface ApiInterface {
  category: {
    list(): Promise<Category[]>
  }
  issue: {
    list(userId?: number): Promise<Issue[]>
    get(issueId: number, userId?: number): Promise<Issue>
    vote(issueId: number, req: CastVoteReq): Promise<VoteResult>
    /** 마감 전 선택 변경. 스테이크는 그대로 유지된다. */
    changeVote(issueId: number, optionId: number): Promise<void>
    replies: {
      list(issueId: number): Promise<Reply[]>
      create(issueId: number, content: string): Promise<Reply>
      delete(issueId: number, replyId: number): Promise<void>
      like(issueId: number, replyId: number): Promise<void>
      report(issueId: number, replyId: number, reason: ReportReason): Promise<void>
    }
  }
  post: {
    list(params?: PostListParams): Promise<PageResponse<PostListItem>>
    get(postId: number): Promise<PostDetail>
    create(req: CreatePostReq): Promise<PostDetail>
    update(postId: number, req: CreatePostReq): Promise<PostDetail>
    delete(postId: number): Promise<void>
    like(postId: number): Promise<void>
    report(postId: number, reason: ReportReason): Promise<void>
    hideAuthor(postId: number): Promise<void>
    replies: {
      list(postId: number): Promise<Reply[]>
      create(postId: number, content: string, parentId?: number): Promise<Reply>
      delete(postId: number, replyId: number): Promise<void>
      like(postId: number, replyId: number): Promise<void>
      report(postId: number, replyId: number, reason: ReportReason): Promise<void>
    }
  }
  upload: {
    image(file: File): Promise<UploadResult>
  }
  auth: {
    me(): Promise<Me>
    socialUrl(provider: SocialProvider): string
    loginEmail(req: EmailLoginReq): Promise<AuthTokenResult>
    signupEmail(req: EmailSignupReq): Promise<AuthTokenResult>
    checkNickname(nickname: string): Promise<NicknameCheckResult>
    completeSocialSignup(req: SocialSignupReq): Promise<Me>
  }
  user: {
    stats(userId: number): Promise<MyStats>
    votes(userId: number): Promise<MyVote[]>
  }
  crew: {
    list(): Promise<Crew[]>
    get(crewId: number): Promise<CrewDetail>
    /** week: 그 주 아무 날짜(YYYY-MM-DD). 생략하면 이번 주. */
    ranking(week?: string): Promise<CrewRankingItem[]>
    topMembers(crewId: number, week?: string): Promise<CrewTopMember[]>
    mine(): Promise<MyCrew>
    /** 30일 안에 다시 바꾸면 409(서버 message 그대로). */
    join(crewId: number): Promise<MyCrew>
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
      /** 삭제 시 걸린 스테이크는 참여자에게 전액 환불된다. */
      delete(issueId: number): Promise<void>
    }
    user: {
      list(params: AdminUserListParams): Promise<PageResponse<AdminUserListItem>>
      get(userId: number): Promise<AdminUserDetail>
      setRole(userId: number, role: BackendRole): Promise<void>
      setSuspended(userId: number, suspended: boolean): Promise<void>
    }
    community: {
      list(params: { type: CommunityContentType }): Promise<AdminCommunityItem[]>
      setHidden(type: CommunityContentType, id: number, hidden: boolean): Promise<void>
      delete(type: CommunityContentType, id: number): Promise<void>
    }
    crew: {
      list(): Promise<AdminCrew[]>
      create(payload: AdminCrewPayload): Promise<AdminCrew>
      update(crewId: number, payload: AdminCrewPayload): Promise<AdminCrew>
    }
    report: {
      list(params: { status: "PENDING" | "DONE" }): Promise<AdminReport[]>
      reject(reportId: number): Promise<void>
      removeContent(reportId: number): Promise<void>
    }
  }
}
