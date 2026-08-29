export type CategoryValue =
  | "all"
  | "politics"
  | "sport"
  | "eSport"
  | "entertainment"
  | "economy"
  | "weather"

export type Category = {
  label: string
  value: CategoryValue
  /** Material Symbols Rounded glyph name */
  icon: string
  /** CSS custom property holding the category color */
  color: string
  count: number
}

export const CATEGORIES: Category[] = [
  { label: "전체", value: "all", icon: "bolt", color: "var(--ink)", count: 28 },
  { label: "정치", value: "politics", icon: "how_to_vote", color: "var(--cat-politics)", count: 3 },
  { label: "스포츠", value: "sport", icon: "sports_soccer", color: "var(--cat-sports)", count: 8 },
  { label: "E스포츠", value: "eSport", icon: "stadia_controller", color: "var(--cat-esports)", count: 5 },
  { label: "연예", value: "entertainment", icon: "mic", color: "var(--cat-ent)", count: 6 },
  { label: "경제", value: "economy", icon: "monitoring", color: "var(--cat-econ)", count: 2 },
  { label: "날씨", value: "weather", icon: "rainy", color: "var(--cat-weather)", count: 4 },
]

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c]),
) as Record<CategoryValue, Category>

/**
 * open      진행 중 · 미참여
 * voted     진행 중 · 참여 완료 (본인에게만 비율 공개)
 * pending   마감 · 결과 대기
 * settled   결과 확정
 */
export type IssueStatus = "open" | "voted" | "pending" | "settled"
export type SettleResult = "correct" | "wrong" | "void"

export type Issue = {
  id: string
  category: Exclude<CategoryValue, "all">
  question: string
  /** 결과 판별 근거 */
  source: string
  /** 선택지 라벨 (문맥형) */
  labels: { yes: string; no: string }
  closesAt: string
  settlesAt: string
  participants: number
  status: IssueStatus
  /** status !== "open" 일 때만 존재 */
  myChoice?: "yes" | "no"
  /** 투표한 사람에게만 내려주는 값. 투표 전에는 서버에서 절대 내려보내지 않는다. */
  ratio?: { yes: number; no: number }
  /** status === "settled" 일 때만 존재 */
  settlement?: {
    result: SettleResult
    answer?: "yes" | "no"
    /** 무효는 0 */
    delta: number
    /** 소수 적중 가중치 */
    weight?: number
    /** 판정 근거 요약 */
    note: string
  }
}

export const ME = {
  name: "박지혁",
  score: 1000,
  tier: "골드 3",
  nextTierAt: 1500,
  weeklyHit: 7,
  weeklyTotal: 9,
}

export const ISSUES: Issue[] = [
  {
    id: "iss_weather_seoul_rain",
    category: "weather",
    question: "내일 서울에 비 올까?",
    source: "기상청 공식 발표 기준",
    labels: { yes: "올 것 같다", no: "안 올 것 같다" },
    closesAt: "2026-08-29T22:00:00+09:00",
    settlesAt: "2026-08-30T09:00:00+09:00",
    participants: 1284,
    status: "open",
  },
  {
    id: "iss_sport_a_team",
    category: "sport",
    question: "오늘 경기, A팀이 이길까?",
    source: "공식 기록 기준",
    labels: { yes: "이길 것 같다", no: "질 것 같다" },
    closesAt: "2026-08-29T20:30:00+09:00",
    settlesAt: "2026-08-29T23:00:00+09:00",
    participants: 3102,
    status: "voted",
    myChoice: "yes",
    ratio: { yes: 17, no: 83 },
  },
  {
    id: "iss_esport_t1",
    category: "eSport",
    question: "이번 주 경기, T1이 이길까?",
    source: "리그 공식 결과 기준",
    labels: { yes: "이길 것 같다", no: "질 것 같다" },
    closesAt: "2026-08-29T18:00:00+09:00",
    settlesAt: "2026-08-29T22:00:00+09:00",
    participants: 8940,
    status: "pending",
    myChoice: "yes",
    ratio: { yes: 41, no: 59 },
  },
  {
    id: "iss_ent_music_no1",
    category: "entertainment",
    question: "이번 주 음악방송 1위, A가 차지할까?",
    source: "방송사 공식 발표 기준",
    labels: { yes: "차지할 것 같다", no: "못 할 것 같다" },
    closesAt: "2026-08-28T17:00:00+09:00",
    settlesAt: "2026-08-28T19:00:00+09:00",
    participants: 4410,
    status: "settled",
    myChoice: "yes",
    ratio: { yes: 22, no: 78 },
    settlement: {
      result: "correct",
      answer: "yes",
      delta: 33,
      weight: 3.6,
      note: "22%만 이쪽을 골랐어요",
    },
  },
  {
    id: "iss_econ_base_rate",
    category: "economy",
    question: "한국은행 이번 달 기준금리 인상할까?",
    source: "금융통화위원회 의결 기준",
    labels: { yes: "인상할 것 같다", no: "동결할 것 같다" },
    closesAt: "2026-08-31T09:00:00+09:00",
    settlesAt: "2026-08-31T11:00:00+09:00",
    participants: 2077,
    status: "settled",
    myChoice: "yes",
    ratio: { yes: 64, no: 36 },
    settlement: {
      result: "wrong",
      answer: "no",
      delta: -21,
      note: "64%가 이쪽이었어요. 흐름을 거스른 판이었습니다.",
    },
  },
  {
    id: "iss_politics_candidate_a",
    category: "politics",
    question: "이번 선거, A 후보 당선될까?",
    source: "중앙선거관리위원회 공식 개표 기준",
    labels: { yes: "당선될 것 같다", no: "안 될 것 같다" },
    closesAt: "2026-08-28T20:00:00+09:00",
    settlesAt: "2026-08-28T23:00:00+09:00",
    participants: 5320,
    status: "settled",
    myChoice: "no",
    settlement: {
      result: "void",
      delta: 0,
      note: "선거가 연기되어 결과를 판정할 수 없었습니다.",
    },
  },
]

export const RANKING = [
  { rank: 1, name: "촉이좋은사람", gained: 412 },
  { rank: 2, name: "역발상러", gained: 388 },
  { rank: 3, name: "비올확률99", gained: 341 },
]

export const MY_RANK = { rank: 18, name: "나", gained: 126 }

/** 점수는 0점 아래로 내려가지 않는다. */
export function applyDelta(score: number, delta: number) {
  return Math.max(0, score + delta)
}

export function formatRemaining(iso: string, now = new Date("2026-08-29T18:47:20+09:00")) {
  const ms = new Date(iso).getTime() - now.getTime()
  if (ms <= 0) return "마감"
  const total = Math.floor(ms / 1000)
  const d = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  return d > 0 ? `${d}일 ${pad(h)}:${pad(m)}` : `${pad(h)}:${pad(m)}:${pad(s)}`
}

/** 마감 임박 여부 — 1시간 이내면 액센트 컬러로 표시 */
export function isUrgent(iso: string, now = new Date("2026-08-29T18:47:20+09:00")) {
  const ms = new Date(iso).getTime() - now.getTime()
  return ms > 0 && ms < 1000 * 60 * 60 * 4
}
