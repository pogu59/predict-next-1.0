import type {
  ApiInterface,
  BackendIssueStatus,
  CastVoteReq,
  Category,
  Issue,
  Me,
  VoteResult,
} from "./types"

/**
 * 백엔드 없이 로컬에서 UI를 확인하기 위한 목데이터. `.env.local`에
 * NEXT_PUBLIC_USE_MOCK=1 을 넣으면 lib/api/index.ts의 Api()가 실제 axios 대신 이걸 쓴다.
 * schema.sql 1절과 동일하게 카테고리는 5개 고정값만 존재한다.
 */
const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: "정치" },
  { id: 2, name: "스포츠" },
  { id: 3, name: "E스포츠" },
  { id: 4, name: "경제" },
  { id: 5, name: "날씨" },
]

// 재현 가능하도록 고정 시드 PRNG(mulberry32) 사용 — 새로고침해도 같은 50개가 나온다.
function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20260905)
const randInt = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1))
const pick = <T,>(arr: readonly T[]) => arr[randInt(0, arr.length - 1)]

/** 실제 있을 법한 실화 기반 이슈 템플릿. {n}은 랜덤 수치로 치환된다. */
const TITLE_TEMPLATES: Record<number, { title: string; options: [string, string] }[]> = {
  1: [
    { title: "여당 지지율이 이번 주 여론조사에서 {n}%를 넘을까요?", options: ["넘는다", "못 넘는다"] },
    { title: "국민연금 개혁안이 이번 정기국회에서 통과될까요?", options: ["통과된다", "무산된다"] },
    { title: "다음 개각에서 교체되는 장관이 {n}명 이상일까요?", options: ["그렇다", "아니다"] },
    { title: "이번 재보궐선거에서 여당 후보가 당선될까요?", options: ["당선된다", "낙선한다"] },
    { title: "국회 본회의가 이번 달 안에 열릴까요?", options: ["열린다", "안 열린다"] },
    { title: "대통령 지지율이 다음 조사에서 오를까요?", options: ["오른다", "내린다"] },
    { title: "이번 개헌 논의가 연내 공식화될까요?", options: ["된다", "안 된다"] },
    { title: "야당 대표가 이번 달 교체될까요?", options: ["교체된다", "유임된다"] },
  ],
  2: [
    { title: "손흥민이 이번 시즌 리그 {n}골을 넘길까요?", options: ["넘긴다", "못 넘긴다"] },
    { title: "한국 야구 대표팀이 이번 국제대회 4강에 갈까요?", options: ["간다", "못 간다"] },
    { title: "K리그 우승팀이 이번 시즌 무패로 우승할까요?", options: ["그렇다", "아니다"] },
    { title: "김민재 소속팀이 이번 챔피언스리그 8강에 갈까요?", options: ["간다", "못 간다"] },
    { title: "이번 올림픽에서 한국 금메달이 {n}개를 넘을까요?", options: ["넘는다", "못 넘는다"] },
    { title: "이번 KBO 한국시리즈가 7차전까지 갈까요?", options: ["간다", "안 간다"] },
    { title: "국가대표팀이 다음 경기에서 승리할까요?", options: ["승리한다", "못 한다"] },
    { title: "이번 시즌 프로농구 우승팀이 작년과 같을까요?", options: ["같다", "다르다"] },
  ],
  3: [
    { title: "T1이 이번 LCK 스프링에서 우승할까요?", options: ["우승한다", "못 한다"] },
    { title: "페이커가 이번 시즌 MVP를 수상할까요?", options: ["수상한다", "못 한다"] },
    { title: "한국 팀이 이번 월드 챔피언십 결승에 진출할까요?", options: ["진출한다", "못 한다"] },
    { title: "젠지가 이번 서머 시즌 세트 전적 전승을 할까요?", options: ["그렇다", "아니다"] },
    { title: "한국 발로란트 대표팀이 국제대회 8강에 갈까요?", options: ["간다", "못 간다"] },
    { title: "이번 롤드컵 결승이 한국 팀끼리 열릴까요?", options: ["그렇다", "아니다"] },
    { title: "다음 시즌 개막전에서 작년 우승팀이 승리할까요?", options: ["승리한다", "패배한다"] },
  ],
  4: [
    { title: "한국은행 기준금리가 이번 분기에 인하될까요?", options: ["인하된다", "동결/인상된다"] },
    { title: "원/달러 환율이 이번 달 {n}원을 넘을까요?", options: ["넘는다", "못 넘는다"] },
    { title: "코스피 지수가 연내 {n}을 돌파할까요?", options: ["돌파한다", "못 한다"] },
    { title: "이번 분기 실업률이 지난 분기보다 낮을까요?", options: ["낮다", "높다"] },
    { title: "삼성전자 주가가 이번 달 말까지 오를까요?", options: ["오른다", "내린다"] },
    { title: "이번 소비자물가상승률이 {n}%를 넘을까요?", options: ["넘는다", "못 넘는다"] },
    { title: "다음 금통위에서 만장일치 결정이 나올까요?", options: ["나온다", "안 나온다"] },
    { title: "이번 분기 수출액이 전년 동기보다 늘어날까요?", options: ["늘어난다", "줄어든다"] },
  ],
  5: [
    { title: "이번 주 서울 강수확률이 {n}%를 넘는 날이 있을까요?", options: ["있다", "없다"] },
    { title: "올해 첫눈이 다음 달 안에 내릴까요?", options: ["내린다", "안 내린다"] },
    { title: "이번 여름 폭염일수가 작년보다 많을까요?", options: ["많다", "적다"] },
    { title: "다음 주에 태풍이 한반도에 상륙할까요?", options: ["상륙한다", "안 한다"] },
    { title: "이번 달 미세먼지 '나쁨' 일수가 {n}일을 넘을까요?", options: ["넘는다", "못 넘는다"] },
    { title: "다음 주말 서울에 눈이 내릴까요?", options: ["내린다", "안 내린다"] },
    { title: "이번 겨울 한파주의보가 {n}회 이상 발령될까요?", options: ["그렇다", "아니다"] },
  ],
}

function randomTitle(categoryId: number) {
  const template = pick(TITLE_TEMPLATES[categoryId])
  const n = randInt(2, 30) * (categoryId === 4 ? 100 : 1)
  return { title: template.title.replace("{n}", String(n)), options: template.options }
}

const STATUS_WEIGHTS: [BackendIssueStatus, number][] = [
  ["OPEN", 5],
  ["PENDING_RESULT", 2],
  ["CONFIRMED", 3],
]
function randomStatus(): BackendIssueStatus {
  const total = STATUS_WEIGHTS.reduce((s, [, w]) => s + w, 0)
  let r = rand() * total
  for (const [status, weight] of STATUS_WEIGHTS) {
    if (r < weight) return status
    r -= weight
  }
  return "OPEN"
}

const MOCK_ISSUE_COUNT = 50
const MOCK_USER_ID = 1

function buildMockIssues(): Issue[] {
  const now = Date.now()
  const issues: Issue[] = []
  for (let i = 0; i < MOCK_ISSUE_COUNT; i++) {
    const category = pick(MOCK_CATEGORIES)
    const { title, options } = randomTitle(category.id)
    const status = randomStatus()
    const voteStartAt = new Date(now - randInt(1, 20) * 86400000)
    const voteDeadlineAt =
      status === "OPEN"
        ? new Date(now + randInt(1, 10) * 86400000)
        : new Date(now - randInt(1, 15) * 86400000)
    const confirmedAt = status === "CONFIRMED" ? new Date(voteDeadlineAt.getTime() + 3600000) : null

    const yesCount = randInt(3, 240)
    const noCount = randInt(3, 240)
    const optionA = { id: i * 2 + 1, text: options[0], voteCount: yesCount }
    const optionB = { id: i * 2 + 2, text: options[1], voteCount: noCount }
    const correctOptionId = status === "CONFIRMED" ? pick([optionA.id, optionB.id]) : null

    // 진행 중인 이슈는 종종 미투표 상태도 섞고, 마감된 이슈는 대부분 참여했던 것으로 채운다
    // (visibleIssues 필터가 myOptionId 없는 pending/confirmed 이슈는 목록에서 숨기기 때문).
    const voted = status === "OPEN" ? rand() < 0.5 : rand() < 0.85
    const myOptionId = voted ? pick([optionA.id, optionB.id]) : null

    issues.push({
      id: i + 1,
      categoryId: category.id,
      title,
      description: null,
      status,
      voteStartAt: voteStartAt.toISOString(),
      voteDeadlineAt: voteDeadlineAt.toISOString(),
      confirmedAt: confirmedAt ? confirmedAt.toISOString() : null,
      correctOptionId,
      options: [optionA, optionB],
      createdAt: voteStartAt.toISOString(),
      myOptionId,
      myStake: null,
    })
  }
  return issues
}

const mockIssues = buildMockIssues()

const mockMe: Me = {
  userId: MOCK_USER_ID,
  nickname: "박지혁",
  credibilityScore: 92,
  tier: "BRONZE",
  role: "USER",
}

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export const mockApi: ApiInterface = {
  category: {
    list: () => delay(MOCK_CATEGORIES),
  },
  issue: {
    list: () => delay(mockIssues),
    get: (issueId) => {
      const found = mockIssues.find((i) => i.id === issueId)
      return found ? delay(found) : Promise.reject({ statusCode: 404, message: "이슈를 찾을 수 없습니다" })
    },
    vote: (issueId, req: CastVoteReq) => {
      const issue = mockIssues.find((i) => i.id === issueId)
      if (!issue) return Promise.reject({ statusCode: 404, message: "이슈를 찾을 수 없습니다" })
      const option = issue.options.find((o) => o.id === req.optionId)
      if (option) option.voteCount = (option.voteCount ?? 0) + 1
      issue.myOptionId = req.optionId
      const result: VoteResult = {
        id: randInt(1000, 9999),
        issueId,
        optionId: req.optionId,
        stake: req.stake,
        remainingCredibility: Math.max(0, mockMe.credibilityScore - req.stake),
        votedAt: new Date().toISOString(),
        liveCounts: issue.options,
      }
      return delay(result)
    },
    replies: {
      list: () => delay([]),
      create: () => Promise.reject({ statusCode: 501, message: "목데이터에서는 지원하지 않습니다" }),
      delete: () => Promise.reject({ statusCode: 501, message: "목데이터에서는 지원하지 않습니다" }),
    },
  },
  post: {
    list: () => delay({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }),
    get: () => Promise.reject({ statusCode: 501, message: "목데이터에서는 지원하지 않습니다" }),
    create: () => Promise.reject({ statusCode: 501, message: "목데이터에서는 지원하지 않습니다" }),
    delete: () => Promise.reject({ statusCode: 501, message: "목데이터에서는 지원하지 않습니다" }),
    replies: {
      list: () => delay([]),
      create: () => Promise.reject({ statusCode: 501, message: "목데이터에서는 지원하지 않습니다" }),
      delete: () => Promise.reject({ statusCode: 501, message: "목데이터에서는 지원하지 않습니다" }),
    },
  },
  auth: {
    me: () => delay(mockMe),
  },
  user: {
    stats: () =>
      delay({
        totalVotes: mockIssues.filter((i) => i.myOptionId != null).length,
        correctCount: mockIssues.filter((i) => i.myOptionId != null && i.myOptionId === i.correctOptionId).length,
        gradedCount: mockIssues.filter((i) => i.status === "CONFIRMED" && i.myOptionId != null).length,
      }),
    votes: () => delay([]),
  },
  admin: {
    issue: {
      list: () => delay({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }),
      get: () => Promise.reject({ statusCode: 501, message: "목데이터에서는 지원하지 않습니다" }),
      create: () => Promise.reject({ statusCode: 501, message: "목데이터에서는 지원하지 않습니다" }),
      update: () => Promise.reject({ statusCode: 501, message: "목데이터에서는 지원하지 않습니다" }),
      extendDeadline: () => Promise.reject({ statusCode: 501, message: "목데이터에서는 지원하지 않습니다" }),
      confirm: () => Promise.reject({ statusCode: 501, message: "목데이터에서는 지원하지 않습니다" }),
      correct: () => Promise.reject({ statusCode: 501, message: "목데이터에서는 지원하지 않습니다" }),
    },
    user: {
      list: () => delay({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }),
      get: () => Promise.reject({ statusCode: 501, message: "목데이터에서는 지원하지 않습니다" }),
    },
  },
}
