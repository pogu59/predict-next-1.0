"use client"

import type { Issue } from "@/lib/api"
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
  issue: Issue
  categoryName: string
  onOpen?: (id: number) => void
}

/**
 * 카드 상태 4종을 한 컴포넌트에서 분기합니다.
 * open    → 선택지 개수만 안내, 실제 투표는 카드를 열어 상세에서만 (카드엔 일부 선택지만
 *           들어가서 그대로 버튼을 두면 나머지 선택지를 못 보고 투표하게 됨)
 * voted   → 내 선택 + 소수 배지 (본인에게만)
 * pending → 결과 대기 배지
 * settled → 결과 배지(적중/오답/결과 확정, 적중 점수는 백엔드에 별도 조회 API가 없어 표시하지 않음)
 */
export function IssueCard({ issue, categoryName, onOpen }: IssueCardProps) {
  const now = useNow()
  const cat = categoryMeta(categoryName)
  const status = issueStatus(issue)
  const settled = status === "settled"
  const pending = status === "pending"
  const result = settled ? settlementResult(issue) : undefined

  const myOptionId = issue.myOptionId ?? undefined
  const ratio = status === "open" ? undefined : voteRatio(issue.options)
  const totalVotes =
    status === "open" ? undefined : totalVoteCount(issue.options)
  const minorityPct =
    ratio && myOptionId !== undefined ? ratio[myOptionId] : undefined
  const isMinority = minorityPct !== undefined && minorityPct < 50
  const myOption = issue.options.find((o) => o.id === myOptionId)
  const correctOption = issue.options.find(
    (o) => o.id === issue.correctOptionId,
  )

  // 카드는 공간이 좁아 선택지를 최대 2개까지만 보여준다. 나머지는 상세 페이지에서 볼 수 있다.
  const votedOptions = (() => {
    if (!ratio) return issue.options.slice(0, 2)
    const byRatioDesc = (a: { id: number }, b: { id: number }) =>
      (ratio[b.id] ?? 0) - (ratio[a.id] ?? 0)
    const top2 = [...issue.options].sort(byRatioDesc).slice(0, 2)
    if (myOption && !top2.some((o) => o.id === myOption.id)) {
      top2[top2.length - 1] = myOption
    }
    return top2.sort(byRatioDesc)
  })()
  const hiddenOptionCount = issue.options.length - 2

  return (
    <article
      className="flex cursor-pointer flex-col overflow-hidden rounded-[14px] border border-line bg-card shadow-[0_1px_2px_rgba(0,0,0,.04)] transition-colors hover:border-line-strong"
      onClick={() => onOpen?.(issue.id)}
    >
      <div className="flex flex-1 flex-col gap-[13px] px-[18px] py-4">
        <div className="flex items-center gap-[7px]">
          <Icon name={cat.icon} size={16} style={{ color: cat.color }} />
          <span className="text-[12px] font-bold" style={{ color: cat.color }}>
            {categoryName}
          </span>

          <div className="flex-auto" />

          {settled ? (
            <span
              className={
                result === "correct"
                  ? "rounded-full bg-accent px-[9px] py-[5px] text-[11.5px] leading-none font-extrabold tabular-nums text-white"
                  : result === "wrong"
                    ? "rounded-full bg-track px-[9px] py-[5px] text-[11.5px] leading-none font-extrabold text-ink-subtle"
                    : "rounded-full border border-line px-[9px] py-[5px] text-[11.5px] leading-none font-extrabold text-ink-subtle"
              }
            >
              {result === "correct"
                ? `${minorityPct}% 적중`
                : result === "wrong"
                  ? "오답"
                  : "결과 확정"}
            </span>
          ) : pending ? (
            <span className="inline-flex items-center gap-[5px] rounded-full border border-warn-border bg-warn-bg px-[9px] py-1 text-[11.5px] leading-none font-extrabold text-warn">
              <Icon name="hourglass_top" filled={false} size={14} />
              결과 대기
            </span>
          ) : (
            <span
              className={`text-[12px] font-extrabold tabular-nums ${
                isUrgent(issue.voteDeadlineAt, now) ? "text-accent" : "text-ink-subtle"
              }`}
            >
              {formatRemaining(issue.voteDeadlineAt, now)}
            </span>
          )}
        </div>

        <h3 className="text-pretty text-[17px] leading-[1.4] font-extrabold tracking-[-0.03em] text-ink">
          {issue.title}
        </h3>

        {status === "open" && (
          <p className="text-[12px] font-semibold text-ink-faint tabular-nums">
            선택지 {issue.options.length}개 · 눌러서 투표하기 →
          </p>
        )}

        {(status === "voted" || pending) && myOption && (
          <div className="flex items-center gap-2 rounded-[10px] border border-line bg-sunken px-3 py-[10px]">
            {status === "voted" && (
              <Icon name="check_circle" size={17} className="flex-none text-accent" />
            )}
            <span className="text-[12px] font-semibold text-ink-muted">내 선택</span>
            <span className="text-[13px] font-extrabold tabular-nums text-ink">
              {myOption.text}
            </span>
            <div className="flex-auto" />
            {status === "voted" && isMinority && (
              <span className="rounded-md bg-hot px-[7px] py-[5px] text-[12px] leading-none font-extrabold text-accent tabular-nums">
                {minorityPct}%만 이쪽
              </span>
            )}
          </div>
        )}

        {status === "voted" && ratio && (
          <>
            <div className="flex flex-col gap-1.5">
              {votedOptions.map((option) => {
                const pct = ratio[option.id] ?? 0
                const isMine = option.id === myOption?.id
                return (
                  <div key={option.id} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[12px] ${isMine ? "font-extrabold text-ink" : "text-ink-subtle"}`}
                      >
                        {option.text}
                      </span>
                      <div className="flex-auto" />
                      <span className="text-[12px] text-ink-subtle tabular-nums">
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-track">
                      <div
                        className={`h-full rounded-full ${isMine ? "bg-accent" : "bg-fill-neutral"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            {hiddenOptionCount > 0 && (
              <span className="text-[12px] text-ink-faint">
                외 선택지 {hiddenOptionCount}개 더 · 상세에서 확인
              </span>
            )}
          </>
        )}

        {settled && (
          <div
            className={
              result === "correct"
                ? "flex items-center gap-2 rounded-[10px] border border-success-border bg-success-bg px-3 py-[10px]"
                : "flex items-center gap-2 rounded-[10px] border border-line bg-sunken px-3 py-[10px]"
            }
          >
            {result === "correct" && (
              <Icon name="check_circle" size={17} className="flex-none text-success" />
            )}
            <span
              className={`text-[13px] font-extrabold ${result === "correct" ? "text-success" : "text-ink-muted"}`}
            >
              {result === "correct"
                ? "맞혔어요"
                : result === "wrong"
                  ? "아쉽게 틀렸어요"
                  : "결과가 확정됐어요"}
            </span>
            <div className="flex-auto" />
            {correctOption && (
              <span
                className={`text-[12px] font-bold ${result === "correct" ? "text-success" : "text-ink-subtle"}`}
              >
                정답 · {correctOption.text}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-line bg-card-faint px-[18px] py-[11px]">
        <Icon name="group" filled={false} size={16} className="flex-none text-ink-subtle" />
        <span className="text-[12px] font-bold text-ink-muted tabular-nums">
          총 {(totalVotes ?? 0).toLocaleString()}명 참여
        </span>
        <div className="flex-auto" />
        <span className="text-[12px] font-bold text-ink-muted">
          {settled ? "결과 확정" : pending ? "결과 판정 예정" : "투표 진행 중"}
        </span>
      </div>
    </article>
  )
}
