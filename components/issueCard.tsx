"use client"

import type { Issue } from "@/lib/api"
import { categoryMeta } from "@/lib/categoryMeta"
import {
  formatRemaining,
  hasVotingStarted,
  issueStatus,
  isUrgent,
  settlementResult,
  stageBadgeClass,
  stageLabel,
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
 * 카드 상태 4종을 한 컴포넌트에서 분기합니다. 우측 상단 배지는 진행(open/voted)·
 * 마감(pending)·완료(settled) 3단어로만 표기한다.
 * 선택지는 상태와 무관하게 항상 상위 2개(득표율 기준, 데이터가 없으면 앞 2개)를 보여주고,
 * 실제 투표는 카드를 열어 상세에서만 한다(나머지 선택지도 상세에서 확인). 내 선택은 별도
 * 박스 없이 체크 아이콘 하나로만 가볍게 표시하고, 정산 결과 문구도 박스 없이 한 줄로 둬서
 * 카드 공간을 아낀다.
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

  const notStarted = status === "open" && !hasVotingStarted(issue, now)
  const label = stageLabel(status, notStarted)
  const badgeClass = stageBadgeClass(status, notStarted)

  // 카드는 공간이 좁아 선택지를 투표율(득표수) 상위 2개까지만 보여준다. 내 선택이 2위 밖이면
  // 밀어내서라도 넣는다. 나머지는 상세 페이지에서 볼 수 있다.
  const topOptions = (() => {
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

          {!settled && !pending && (
            <span
              className={`text-[12px] font-extrabold tabular-nums ${
                !notStarted && isUrgent(issue.voteDeadlineAt, now) ? "text-accent" : "text-ink-subtle"
              }`}
            >
              {notStarted
                ? formatRemaining(issue.voteStartAt, now)
                : formatRemaining(issue.voteDeadlineAt, now)}
            </span>
          )}

          <span
            className={`inline-flex items-center gap-[5px] rounded-full px-[9px] py-1 text-[11.5px] leading-none font-extrabold ${badgeClass}`}
          >
            {pending && <Icon name="hourglass_top" filled={false} size={14} />}
            {label}
          </span>
        </div>

        <h3 className="text-pretty text-[17px] leading-[1.4] font-extrabold tracking-[-0.03em] text-ink">
          {issue.title}
        </h3>

        {/* 선택지: 득표율 상위 2개 우선(투표 전이라 데이터가 없으면 텍스트만). 내 선택은
            박스로 따로 빼지 않고 체크 아이콘 하나로만 가볍게 표시한다 — 카드 공간 절약. */}
        <div className="flex flex-col gap-1.5">
          {topOptions.map((option) => {
            const pct = ratio?.[option.id]
            const isMine = option.id === myOption?.id
            const minority = isMine && isMinority
            return (
              <div key={option.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  {isMine && (
                    <Icon name="check_circle" size={13} className="flex-none text-accent" />
                  )}
                  <span
                    className={`text-[12px] ${isMine ? "font-extrabold text-ink" : "text-ink-subtle"}`}
                  >
                    {option.text}
                  </span>
                  <div className="flex-auto" />
                  {pct !== undefined && (
                    <span
                      className={`text-[12px] tabular-nums ${minority ? "font-bold text-accent" : "text-ink-subtle"}`}
                    >
                      {pct}%{minority && " · 소수"}
                    </span>
                  )}
                </div>
                {/* 투표 전이라 pct가 없어도 빈 바(트랙만)를 그려서 카드 모양을 통일한다. */}
                <div className="h-1.5 overflow-hidden rounded-full bg-track">
                  {pct !== undefined && (
                    <div className="h-full rounded-full bg-info" style={{ width: `${pct}%` }} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {hiddenOptionCount > 0 && (
          <span className="text-[12px] text-ink-faint">
            외 선택지 {hiddenOptionCount}개 더 ·{" "}
            {ratio ? "상세에서 확인" : notStarted ? "시작 전" : "눌러서 투표하기"}
          </span>
        )}
        {!ratio && hiddenOptionCount <= 0 && (
          <p className="text-[12px] font-semibold text-ink-faint">
            {notStarted ? "곧 시작해요" : "눌러서 투표하기 →"}
          </p>
        )}

        {settled && (
          <p
            className={`inline-flex items-center gap-1.5 text-[12.5px] font-bold ${
              result === "correct" ? "text-success" : "text-ink-muted"
            }`}
          >
            {result === "correct" && <Icon name="check_circle" size={14} className="flex-none" />}
            {result === "correct"
              ? "맞혔어요"
              : result === "wrong"
                ? "아쉽게 틀렸어요"
                : "결과가 확정됐어요"}
            {correctOption && ` · 정답 · ${correctOption.text}`}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-line bg-card-faint px-[18px] py-[11px]">
        <Icon name="group" filled={false} size={16} className="flex-none text-ink-subtle" />
        <span className="text-[12px] font-bold text-ink-muted tabular-nums">
          총 {(totalVotes ?? 0).toLocaleString()}명 참여
        </span>
        <div className="flex-auto" />
        <span className="text-[12px] font-bold text-ink-muted">{label}</span>
      </div>
    </article>
  )
}
