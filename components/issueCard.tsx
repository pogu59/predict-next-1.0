"use client"

import type { Topic } from "@/lib/api"
import { categoryMeta } from "@/lib/categoryMeta"
import {
  formatRemaining,
  issueStatus,
  isUrgent,
  settlementResult,
  totalVoteCount,
  useNow,
  voteRatio,
} from "@/lib/issues"
import { Icon } from "@/components/icon"

type IssueCardProps = {
  topic: Topic
  categoryName: string
  onVote?: (id: number, optionId: number) => void
  onOpen?: (id: number) => void
}

/**
 * 카드 상태 4종을 한 컴포넌트에서 분기합니다.
 * open    → 인라인 투표 버튼, 비율 비공개
 * voted   → 내 선택 + 소수 배지 (본인에게만)
 * pending → sunken 표면, 저채도
 * settled → hot 표면 + 결과 배지 (적중 점수는 백엔드에 별도 조회 API가 없어 표시하지 않음)
 */
export function IssueCard({
  topic,
  categoryName,
  onVote,
  onOpen,
}: IssueCardProps) {
  const now = useNow()
  const cat = categoryMeta(categoryName)
  const status = issueStatus(topic)
  const settled = status === "settled"
  const pending = status === "pending"
  const result = settled ? settlementResult(topic) : undefined

  const surface = settled
    ? "bg-card-hot border-[color:color-mix(in_oklab,var(--accent)_32%,transparent)]"
    : pending
      ? "bg-sunken border-[rgb(255_255_255/0.05)]"
      : "bg-card border-line"

  const myOptionId = topic.myOptionId ?? undefined
  const ratio = status === "open" ? undefined : voteRatio(topic.options)
  const totalVotes =
    status === "open" ? undefined : totalVoteCount(topic.options)
  const minorityPct =
    ratio && myOptionId !== undefined ? ratio[myOptionId] : undefined
  const isMinority = minorityPct !== undefined && minorityPct < 50
  const myOption = topic.options.find((o) => o.id === myOptionId)
  const correctOption = topic.options.find(
    (o) => o.id === topic.correctOptionId,
  )

  const deltaColor =
    result === "correct"
      ? "text-accent"
      : result === "wrong"
        ? "text-wrong"
        : "text-void"

  // 카드는 공간이 좁아 선택지를 최대 2개까지만 보여준다. 나머지는 상세 페이지에서 볼 수 있다.
  const openOptions = topic.options.slice(0, 2)
  const votedOptions = (() => {
    if (!ratio) return topic.options.slice(0, 2)
    const byRatioDesc = (a: { id: number }, b: { id: number }) =>
      (ratio[b.id] ?? 0) - (ratio[a.id] ?? 0)
    const top2 = [...topic.options].sort(byRatioDesc).slice(0, 2)
    if (myOption && !top2.some((o) => o.id === myOption.id)) {
      top2[top2.length - 1] = myOption
    }
    return top2.sort(byRatioDesc)
  })()
  const hiddenOptionCount = topic.options.length - 2

  return (
    <article
      className={`flex cursor-pointer overflow-hidden rounded-xl border ${surface}`}
      onClick={() => onOpen?.(topic.id)}
    >
      <div
        className="w-1 flex-none"
        style={{
          background: pending
            ? `color-mix(in oklab, ${cat.color} 45%, transparent)`
            : cat.color,
        }}
      />

      <div className="flex flex-1 flex-col gap-3 px-[18px] py-[17px]">
        <div className="flex items-center gap-2">
          <Icon
            name={cat.icon}
            size={16}
            style={{
              color: pending
                ? `color-mix(in oklab, ${cat.color} 60%, transparent)`
                : cat.color,
            }}
          />
          <span
            className="text-label"
            style={{
              color: pending
                ? `color-mix(in oklab, ${cat.color} 60%, transparent)`
                : cat.color,
            }}
          >
            {categoryName}
          </span>

          <div className="flex-auto" />

          {settled ? (
            <span
              className={
                result === "correct"
                  ? "rounded-md bg-accent px-2 py-1 text-caption leading-none font-extrabold text-accent-ink"
                  : result === "wrong"
                    ? "rounded-md bg-wrong-chip px-2 py-1 text-caption leading-none font-extrabold text-[#D6DEEC]"
                    : "rounded-md border border-line-strong px-2 py-[3px] text-caption leading-none font-extrabold text-ink-subtle"
              }
            >
              {result === "correct"
                ? `${minorityPct}% 적중`
                : result === "wrong"
                  ? "오답"
                  : "결과 확정"}
            </span>
          ) : pending ? (
            <span className="inline-flex items-center gap-1.5 text-caption text-ink-subtle">
              <Icon name="hourglass_top" filled={false} size={15} />
              결과 대기
            </span>
          ) : (
            <span
              className={`text-caption font-extrabold tabular-nums ${
                isUrgent(topic.voteDeadlineAt, now)
                  ? "text-accent"
                  : "text-ink-subtle"
              }`}
            >
              {formatRemaining(topic.voteDeadlineAt, now)}
            </span>
          )}
        </div>

        <h3
          className={`text-h3 text-pretty ${pending ? "text-ink-muted" : "text-ink"}`}
        >
          {topic.title}
        </h3>

        {status === "open" && (
          <>
            <div className="flex flex-col gap-2">
              {openOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onVote?.(topic.id, option.id)
                  }}
                  className="rounded-lg border border-[rgb(255_255_255/0.09)] bg-control py-[13px] text-label text-ink transition-colors hover:border-accent hover:text-accent"
                >
                  {option.text}
                </button>
              ))}
            </div>
          </>
        )}

        {status === "voted" && myOption && ratio && (
          <>
            <div className="flex items-center gap-2.5 rounded-lg bg-sunken px-[13px] py-3">
              <Icon
                name="check_circle"
                size={17}
                className="text-accent"
                style={{ color: "var(--accent)" }}
              />
              <span className="text-label">내 선택 · {myOption.text}</span>
              <div className="flex-auto" />
              {isMinority && (
                <span className="rounded-md bg-[color:color-mix(in_oklab,var(--accent)_14%,transparent)] px-[7px] py-[5px] text-caption leading-none font-extrabold text-accent tabular-nums">
                  {minorityPct}%만 이쪽
                </span>
              )}
            </div>
            <div className="flex h-1.5 gap-1">
              {votedOptions.map((option) => (
                <div
                  key={option.id}
                  className={
                    option.id === myOption.id
                      ? "rounded-full bg-accent"
                      : "rounded-full bg-track"
                  }
                  style={{ width: `${ratio[option.id] ?? 0}%` }}
                />
              ))}
            </div>
            {hiddenOptionCount > 0 && (
              <span className="text-caption text-ink-faint">
                외 선택지 {hiddenOptionCount}개 더 · 상세에서 확인
              </span>
            )}
          </>
        )}

        {pending && (
          <p className="text-caption font-semibold text-ink-faint tabular-nums">
            {myOption
              ? `결과 판정 예정 · 내 선택 ${myOption.text}`
              : "결과 판정 예정"}
          </p>
        )}

        {settled && (
          <div className="flex items-end gap-4">
            <div className="flex flex-1 flex-col gap-1">
              <div className={`text-label ${deltaColor}`}>
                {result === "correct"
                  ? "맞혔어요"
                  : result === "wrong"
                    ? "아쉽게 틀렸어요"
                    : "결과가 확정됐어요"}
              </div>
              <div className="text-caption leading-[1.55] font-semibold text-pretty text-ink-faint">
                {correctOption && `정답 · ${correctOption.text}`}
                {totalVotes !== undefined &&
                  ` · 총 ${totalVotes.toLocaleString()}명 참여`}
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
