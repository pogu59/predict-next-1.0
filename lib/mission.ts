import type {
  ExchangeStatus,
  MissionListItem,
  MissionType,
  RewardTransactionType,
} from "@/lib/api"

/**
 * 오늘의 미션(출석 제외)을 모두 통과하면 주는 보너스. 백엔드 MissionService.DAILY_BONUS_POINTS와
 * 같은 값이다 — API로 내려오지 않아서 여기 한 곳에만 둔다.
 */
export const DAILY_BONUS_POINTS = 30

export const MISSION_TYPE_LABEL: Record<MissionType, string> = {
  ATTENDANCE: "출석 체크",
  BALANCE: "밸런스 게임",
  SURVEY: "설문",
}

/** "1,250P" */
export function formatPoints(n: number) {
  return `${n.toLocaleString()}P`
}

/** "+50P" / "−3,000P"(U+2212 빼기 기호 — 하이픈보다 숫자와 높이가 맞는다). */
export function signedPoints(n: number) {
  return n >= 0 ? `+${formatPoints(n)}` : `−${formatPoints(-n)}`
}

/** 목록 카드 위 한 줄. "설문 · 5문항", "밸런스 게임" */
export function missionMeta(mission: {
  type: MissionType
  questionCount: number
}) {
  const label = MISSION_TYPE_LABEL[mission.type]
  return mission.type === "SURVEY"
    ? `${label} · ${mission.questionCount}문항`
    : label
}

/** 미션 목록을 화면 구역(출석 · 오늘의 미션 · 그 밖의 미션)으로 나눈다. 서버 순서는 그대로 둔다. */
export function splitMissions(items: MissionListItem[]) {
  return {
    attendance: items.find((m) => m.type === "ATTENDANCE"),
    daily: items.filter((m) => m.daily && m.type !== "ATTENDANCE"),
    others: items.filter((m) => !m.daily && m.type !== "ATTENDANCE"),
  }
}

export type DailyProgress = {
  total: number
  approved: number
  remaining: number
  /**
   * none: 오늘의 미션 없음, open: 아직 남음, done: 모두 통과(보너스 받음),
   * missed: 반려된 미션이 있어 오늘은 보너스를 받을 수 없음.
   */
  bonus: "none" | "open" | "done" | "missed"
}

/**
 * 오늘의 미션 진행도. 서버 규칙(그날 열린 is_daily 미션을 모두 "통과"해야 보너스)과 같은 기준이라
 * 반려가 하나라도 있으면 보너스는 놓친 것으로 본다.
 */
export function dailyProgress(items: MissionListItem[]): DailyProgress {
  const daily = items.filter((m) => m.daily && m.type !== "ATTENDANCE")
  const approved = daily.filter((m) => m.myStatus === "APPROVED").length
  const rejected = daily.some((m) => m.myStatus === "REJECTED")
  const total = daily.length
  const bonus =
    total === 0
      ? "none"
      : rejected
        ? "missed"
        : approved === total
          ? "done"
          : "open"
  return { total, approved, remaining: total - approved, bonus }
}

export const EXCHANGE_STATUS: Record<
  ExchangeStatus,
  { label: string; className: string }
> = {
  REQUESTED: { label: "확인 중", className: "bg-warn-soft text-warn-ink" },
  SENT: { label: "발송 완료", className: "bg-success-soft text-success-ink" },
  REJECTED: { label: "반려", className: "bg-danger-soft text-danger-ink" },
  CANCELED: { label: "취소", className: "bg-line-3 text-sub" },
}

export const TRANSACTION_LABEL: Record<RewardTransactionType, string> = {
  EARN: "미션 적립",
  BONUS: "보너스",
  EXCHANGE: "교환 신청",
  REFUND: "포인트 돌려받음",
  ADJUST: "운영자 조정",
}

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

/** 내역 묶음 제목. "오늘" / "어제" / "10월 6일" */
export function dayLabel(iso: string, now: Date) {
  const d = new Date(iso)
  const days = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000)
  if (days === 0) return "오늘"
  if (days === 1) return "어제"
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}
