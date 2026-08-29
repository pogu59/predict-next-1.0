"use client"

import { categoryMeta } from "@/lib/category-meta"
import { formatRemaining, isUrgent, type UiIssue } from "@/lib/issues"
import { Icon } from "@/components/icon"

type IssueCardProps = {
  issue: UiIssue
  categoryName: string
  onVote?: (id: number, choice: "yes" | "no") => void
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
  issue,
  categoryName,
  onVote,
  onOpen,
}: IssueCardProps) {
  const cat = categoryMeta(categoryName)
  const settled = issue.status === "settled"
  const pending = issue.status === "pending"
  const result = issue.settlement?.result

  const surface = settled
    ? "bg-card-hot border-[color:color-mix(in_oklab,var(--accent)_32%,transparent)]"
    : pending
      ? "bg-sunken border-[rgb(255_255_255/0.05)]"
      : "bg-card border-line"

  const minorityPct =
    issue.ratio && issue.myChoice ? issue.ratio[issue.myChoice] : undefined
  const isMinority = minorityPct !== undefined && minorityPct < 50

  const deltaColor =
    result === "correct"
      ? "text-accent"
      : result === "wrong"
        ? "text-wrong"
        : "text-void"

  return (
    <article
      className={`flex overflow-hidden rounded-xl border ${surface}`}
      onClick={settled || pending ? () => onOpen?.(issue.id) : undefined}
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
            className="text-xs font-bold"
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
                  ? "rounded-md bg-accent px-2 py-1 text-[11.5px] leading-none font-extrabold text-accent-ink"
                  : result === "wrong"
                    ? "rounded-md bg-wrong-chip px-2 py-1 text-[11.5px] leading-none font-extrabold text-[#D6DEEC]"
                    : result === "void"
                      ? "rounded-md border border-[color:color-mix(in_oklab,var(--void)_45%,transparent)] px-2 py-[3px] text-[11.5px] leading-none font-extrabold text-void"
                      : "rounded-md border border-line-strong px-2 py-[3px] text-[11.5px] leading-none font-extrabold text-ink-subtle"
              }
            >
              {result === "correct"
                ? `${minorityPct}% 적중`
                : result === "wrong"
                  ? "오답"
                  : result === "void"
                    ? "무효"
                    : "결과 확정"}
            </span>
          ) : pending ? (
            <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-ink-subtle">
              <Icon name="hourglass_top" filled={false} size={15} />
              결과 대기
            </span>
          ) : (
            <span
              className={`text-[12.5px] font-extrabold tabular-nums ${
                isUrgent(issue.closesAt) ? "text-accent" : "text-ink-subtle"
              }`}
            >
              {formatRemaining(issue.closesAt)}
            </span>
          )}
        </div>

        <h3
          className={`text-xl leading-[1.35] font-bold tracking-[-0.03em] text-pretty ${
            pending ? "text-ink-muted" : "text-ink"
          }`}
        >
          {issue.question}
        </h3>

        {issue.status === "open" && (
          <>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onVote?.(issue.id, "yes")}
                className="flex-1 rounded-lg border border-[rgb(255_255_255/0.09)] bg-control py-[13px] text-sm font-bold tracking-[-0.02em] text-ink transition-colors hover:border-accent hover:text-accent"
              >
                {issue.labels.yes}
              </button>
              <button
                type="button"
                onClick={() => onVote?.(issue.id, "no")}
                className="flex-1 rounded-lg border border-[rgb(255_255_255/0.09)] bg-control py-[13px] text-sm font-bold tracking-[-0.02em] text-ink transition-colors hover:border-accent hover:text-accent"
              >
                {issue.labels.no}
              </button>
            </div>
            <p className="text-[11.5px] font-semibold text-ink-faint">
              {issue.source} · 비율은 투표 후 공개
            </p>
          </>
        )}

        {issue.status === "voted" && issue.myChoice && issue.ratio && (
          <>
            <div className="flex items-center gap-2.5 rounded-lg bg-sunken px-[13px] py-3">
              <Icon
                name="check_circle"
                size={17}
                className="text-accent"
                style={{ color: "var(--accent)" }}
              />
              <span className="text-[13.5px] font-bold tracking-[-0.02em]">
                내 선택 · {issue.labels[issue.myChoice]}
              </span>
              <div className="flex-auto" />
              {isMinority && (
                <span className="rounded-md bg-[color:color-mix(in_oklab,var(--accent)_14%,transparent)] px-[7px] py-[5px] text-[11.5px] leading-none font-extrabold text-accent tabular-nums">
                  {minorityPct}%만 이쪽
                </span>
              )}
            </div>
            <div className="flex h-1.5 gap-1">
              <div
                className="rounded-full bg-accent"
                style={{ width: `${minorityPct}%` }}
              />
              <div className="flex-1 rounded-full bg-track" />
            </div>
          </>
        )}

        {pending && (
          <p className="text-[11.5px] font-semibold text-ink-faint tabular-nums">
            {issue.myChoice
              ? `결과 판정 예정 · 내 선택 ${issue.labels[issue.myChoice]}`
              : "결과 판정 예정"}
          </p>
        )}

        {settled && issue.settlement && (
          <div className="flex items-end gap-4">
            <div className="flex flex-1 flex-col gap-1">
              <span
                className={`text-[13px] font-bold tracking-[-0.02em] ${deltaColor}`}
              >
                {result === "correct"
                  ? "맞혔어요"
                  : result === "wrong"
                    ? "아쉽게 틀렸어요"
                    : result === "void"
                      ? "무효 처리"
                      : "결과가 확정됐어요"}
              </span>
              <span className="text-[11.5px] leading-[1.55] font-semibold text-pretty text-ink-faint">
                {issue.settlement.answer &&
                  `정답 · ${issue.labels[issue.settlement.answer]}`}
                {issue.totalVotes !== undefined &&
                  ` · 총 ${issue.totalVotes.toLocaleString()}명 참여`}
              </span>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
