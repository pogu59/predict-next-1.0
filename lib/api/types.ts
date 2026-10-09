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
}

// ---- 자유 게시판 ----

/** hot = 좋아요 + 댓글x3, comments = 댓글 많은 순, views = 조회 많은 순 */
export type PostSort = "hot" | "new" | "comments" | "views"

/** 말머리. 말머리가 생기기 전에 쓴 글은 null. */
export type PostTopic = "INFO" | "ANALYSIS" | "QUESTION" | "CHAT"

/** 검색 범위 — 전체(제목·본문·닉네임) / 제목 / 작성자 */
export type PostSearchScope = "all" | "title" | "author"

/** 기간 — 전체 / 24시간 / 7일 / 30일 */
export type PostPeriod = "all" | "day" | "week" | "month"

export type PostListItem = {
  id: number
  authorNickname: string
  title: string
  /** 본문 첫 줄 미리보기. */
  contentPreview?: string
  thumbnailUrl?: string | null
  imageCount?: number
  topic?: PostTopic | null
  likeCount: number
  likedByMe: boolean
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
  images: string[]
  topic?: PostTopic | null
  likeCount: number
  likedByMe: boolean
  viewCount: number
  createdAt: string
}

export type CreatePostReq = {
  title: string
  content: string
  /** 업로드 API(upload.image)가 돌려준 URL. 최대 4장. */
  images?: string[]
  topic?: PostTopic | null
}

export type PostListParams = {
  keyword?: string
  /** 단어를 공백으로 나누면 모두 들어간 글만(AND). */
  scope?: PostSearchScope
  sort?: PostSort
  topic?: PostTopic
  period?: PostPeriod
  hasImage?: boolean
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

// ---- 미션 · 리워드 포인트 ----
//
// 리워드 포인트는 미션으로만 쌓이고 기프티콘 교환에만 쓴다. 신용도(Me.credibilityScore)와는
// 완전히 분리된 값이라, 두 값을 더하거나 서로 바꾸는 화면·계산을 만들지 않는다.

export type MissionType = "ATTENDANCE" | "BALANCE" | "SURVEY"

export type MissionStatus = "DRAFT" | "OPEN" | "CLOSED"

export type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED"

export type MissionListItem = {
  id: number
  type: MissionType
  title: string
  description: string | null
  rewardPoints: number
  /** 오늘의 미션 여부(출석 제외 모두 통과하면 보너스). */
  daily: boolean
  endsAt: string
  questionCount: number
  /** 내 제출 상태. 참여 전·비로그인이면 null. 출석은 오늘 제출만 본다. */
  myStatus: SubmissionStatus | null
  myRejectReason: string | null
}

export type MissionQuestion = {
  id: number
  sortOrder: number
  text: string
  options: string[]
}

export type MissionDetail = Omit<MissionListItem, "questionCount"> & {
  /** 지금 참여할 수 있는지(공개 기간·상태 기준, 내 참여 여부와는 별개). */
  available: boolean
  questions: MissionQuestion[]
}

export type SubmitMissionReq = {
  /** 문항 순서대로 고른 보기 인덱스(출석은 빈 배열). */
  answers: number[]
  /** 미션 화면을 연 뒤 제출까지 걸린 시간. 너무 빠른 응답 판정에 쓰인다. */
  durationMs: number
}

export type SubmitMissionResult = {
  submissionId: number
  status: SubmissionStatus
  rejectReason: string | null
  earnedPoints: number
  /** 오늘의 미션 모두 완료 보너스(없으면 0). */
  bonusPoints: number
  /** 처리 후 리워드 포인트 잔액. */
  balance: number
}

export type MissionQuestionResult = {
  questionId: number
  text: string
  options: string[]
  /** 보기 순서대로 0~100 정수, 합 100. 참여 인원은 내려오지 않는다. */
  percents: number[]
  myAnswer: number | null
}

export type MissionResults = {
  missionId: number
  title: string
  questions: MissionQuestionResult[]
}

export type RewardTransactionType = "EARN" | "BONUS" | "EXCHANGE" | "REFUND" | "ADJUST"

export type ExchangeStatus = "REQUESTED" | "SENT" | "REJECTED" | "CANCELED"

export type RewardTransaction = {
  id: number
  type: RewardTransactionType
  /** 부호 있는 변동량(+적립, -교환 신청). */
  amount: number
  balanceAfter: number
  memo: string | null
  createdAt: string
}

export type RewardExchange = {
  id: number
  productCode: string
  productName: string
  points: number
  status: ExchangeStatus
  rejectReason: string | null
  createdAt: string
  handledAt: string | null
}

export type RewardProduct = {
  code: string
  name: string
  points: number
}

export type RewardWallet = {
  balance: number
  /** 확인 중인 교환 신청에 묶인 포인트(이미 잔액에서 빠져 있다). */
  pendingExchangePoints: number
  monthEarned: number
  transactions: RewardTransaction[]
  exchanges: RewardExchange[]
  /** 포인트 오름차순. */
  products: RewardProduct[]
}

// ---- 관리자: 미션 / 교환 승인 ----

export type AdminMissionListItem = {
  id: number
  type: MissionType
  title: string
  rewardPoints: number
  daily: boolean
  status: MissionStatus
  startsAt: string
  endsAt: string
  questionCount: number
  approvedCount: number
  rejectedCount: number
}

export type AdminMissionQuestionReq = {
  text: string
  options: string[]
  /** 확인(주의) 문항이면 정답 보기 인덱스. */
  attentionAnswerIndex?: number | null
}

export type AdminMissionCreateReq = {
  type: MissionType
  title: string
  description?: string | null
  rewardPoints: number
  daily: boolean
  /** LocalDateTime 형식(YYYY-MM-DDTHH:mm). */
  startsAt: string
  endsAt: string
  questions: AdminMissionQuestionReq[]
  openNow: boolean
}

export type AdminExchange = {
  id: number
  userId: number
  nickname: string
  productCode: string
  productName: string
  points: number
  status: ExchangeStatus
  rejectReason: string | null
  createdAt: string
  handledAt: string | null
  handledByNickname: string | null
  /** 신청자의 미션 통과·반려 수 — 부정 참여 의심을 판단하는 참고 신호. */
  approvedSubmissions: number
  rejectedSubmissions: number
}

// ---- API 계약 ----
//
// predict 백엔드는 statusCode 봉투가 아니라 실제 HTTP 상태코드를 쓰고, 성공 응답은
// DTO를 봉투 없이 그대로 내려준다. 이 계약과 봉투 해제/에러 정규화는 client.ts 한 곳에만 있고,
// 아래 인터페이스와 각 네임스페이스 구현은 그 결과 타입만 안다.
//
// 모든 엔드포인트는 predict-spring-1.0 백엔드에 구현되어 있다
// (mission · reward · admin.mission · admin.exchange는 같은 이름의 feat/mission-reward 브랜치).
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
  mission: {
    /** 지금 참여할 수 있는 미션(오늘의 미션이 앞). 로그인했으면 내 상태가 붙는다. */
    list(): Promise<MissionListItem[]>
    get(missionId: number): Promise<MissionDetail>
    submit(missionId: number, req: SubmitMissionReq): Promise<SubmitMissionResult>
    /** 참여한 사람에게만 문항별 응답 비율(확인 문항 제외). */
    results(missionId: number): Promise<MissionResults>
  }
  reward: {
    me(): Promise<RewardWallet>
    /** 신청 즉시 포인트가 빠지고, 반려·취소되면 돌려받는다. */
    requestExchange(productCode: string): Promise<RewardExchange>
    cancelExchange(exchangeId: number): Promise<RewardExchange>
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
    report: {
      list(params: { status: "PENDING" | "DONE" }): Promise<AdminReport[]>
      reject(reportId: number): Promise<void>
      removeContent(reportId: number): Promise<void>
    }
    mission: {
      list(): Promise<AdminMissionListItem[]>
      create(req: AdminMissionCreateReq): Promise<AdminMissionListItem>
      open(missionId: number): Promise<AdminMissionListItem>
      close(missionId: number): Promise<AdminMissionListItem>
    }
    exchange: {
      /** status를 주면 그 상태만(확인 대기는 오래된 순), 없으면 전체 최신순. */
      list(params: { status?: ExchangeStatus }): Promise<AdminExchange[]>
      send(exchangeId: number): Promise<AdminExchange>
      /** 반려하면 포인트가 바로 환불된다. */
      reject(exchangeId: number, reason: string): Promise<AdminExchange>
    }
  }
}
