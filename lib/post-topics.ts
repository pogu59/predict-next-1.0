import type { PostPeriod, PostTopic } from "@/lib/api"

/** 말머리 라벨과 배지 색(디자인 토큰만 사용). */
export const POST_TOPICS: {
  key: PostTopic
  label: string
  className: string
}[] = [
  { key: "INFO", label: "정보", className: "bg-brand-soft text-brand" },
  { key: "ANALYSIS", label: "분석", className: "bg-success-soft text-success" },
  { key: "QUESTION", label: "질문", className: "bg-warn-soft text-warn-ink" },
  { key: "CHAT", label: "잡담", className: "bg-line-3 text-sub" },
]

export function topicMeta(topic: PostTopic | null | undefined) {
  return POST_TOPICS.find((t) => t.key === topic) ?? null
}

export function parseTopic(value: string | null): PostTopic | undefined {
  return POST_TOPICS.some((t) => t.key === value)
    ? (value as PostTopic)
    : undefined
}

/** 게시판 기간 필터. */
export const POST_PERIODS: { key: PostPeriod; label: string }[] = [
  { key: "all", label: "전체 기간" },
  { key: "day", label: "오늘" },
  { key: "week", label: "이번 주" },
  { key: "month", label: "이번 달" },
]
