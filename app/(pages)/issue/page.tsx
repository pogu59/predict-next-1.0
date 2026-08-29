"use client"

import { useMemo, useState } from "react"

import {
  applyDelta,
  CATEGORIES,
  CategoryValue,
  Issue,
  ISSUES,
  ME,
  MY_RANK,
  RANKING,
} from "@/lib/mock"
import { Icon } from "@/components/icon"
import { IssueCard } from "@/components/issue-card"

export default function IssuePage() {
  const [category, setCategory] = useState<CategoryValue>(CATEGORIES[0].value)
  const [issues, setIssues] = useState<Issue[]>(ISSUES)
  const [score, setScore] = useState(ME.score)

  const list = useMemo(
    () =>
      category === "all"
        ? issues
        : issues.filter((i) => i.category === category),
    [category, issues],
  )

  const votedCount = issues.filter((i) => i.status === "voted").length

  /** 투표하면 그 순간부터 본인에게만 비율이 열립니다. */
  function handleVote(id: string, choice: "yes" | "no") {
    setIssues((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              status: "voted",
              myChoice: choice,
              participants: i.participants + 1,
              ratio: i.ratio ?? { yes: 17, no: 83 },
            }
          : i,
      ),
    )
  }

  const progress = Math.min(100, (score / ME.nextTierAt) * 100)

  return (
    <div className="flex flex-col gap-[22px] px-6 pt-8 pb-11">
      <section className="flex flex-col gap-3">
        <div className="text-ink-subtle text-xs font-bold tracking-[0.05em]">
          카테고리
        </div>
        <div className="flex items-center gap-2">
          {CATEGORIES.map((c) => {
            const active = c.value === category
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={
                  active
                    ? "bg-ink inline-flex items-center gap-[7px] rounded-full px-[17px] py-2.5 text-sm leading-none font-extrabold tracking-[-0.02em] text-bg"
                    : "border-line text-ink-muted hover:text-ink inline-flex items-center gap-[7px] rounded-full border bg-card px-[17px] py-2.5 text-sm leading-none font-bold tracking-[-0.02em] transition-colors"
                }
              >
                <Icon
                  name={c.icon}
                  size={17}
                  style={{ color: active ? "var(--bg)" : c.color }}
                />
                {c.label}
                <span
                  className={`text-[11.5px] font-bold tabular-nums ${
                    active
                      ? "text-[color:color-mix(in_oklab,var(--bg)_50%,transparent)]"
                      : "text-ink-faint"
                  }`}
                >
                  {c.count}
                </span>
              </button>
            )
          })}

          <div className="flex-auto" />

          <button
            type="button"
            className="text-ink-subtle inline-flex items-center gap-1.5 text-[13px] font-bold"
          >
            마감 임박순
            <Icon name="expand_more" size={16} />
          </button>
        </div>
      </section>

      <div className="grid grid-cols-[1fr_266px] gap-[30px]">
        <section className="flex flex-col gap-[13px]">
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-2xl font-extrabold tracking-[-0.04em]">
              진행 중인 이슈
            </h2>
            <span className="text-ink-subtle text-[12.5px] font-bold tabular-nums">
              {list.length}건 · 참여 완료 {votedCount}건
            </span>
          </div>

          <div className="grid grid-cols-2 gap-[13px]">
            {list.map((issue) => (
              <IssueCard key={issue.id} issue={issue} onVote={handleVote} />
            ))}
          </div>

          {list.length === 0 && (
            <div className="border-line-strong text-ink-subtle rounded-xl border border-dashed px-5 py-10 text-center text-sm font-bold">
              이 카테고리에 진행 중인 이슈가 없어요
            </div>
          )}
        </section>

        <aside className="flex flex-col gap-[13px]">
          <div
            className="flex flex-col gap-3 rounded-2xl p-[17px]"
            style={{
              background:
                "linear-gradient(105deg, var(--accent), var(--accent-deep))",
            }}
          >
            <span className="text-[11.5px] font-bold text-[color:color-mix(in_oklab,var(--accent-ink)_62%,transparent)]">
              내 신용도 · {ME.tier}
            </span>
            <span className="text-accent-ink text-4xl leading-none font-extrabold tracking-[-0.045em] tabular-nums">
              {score.toLocaleString()}
            </span>
            <div className="h-[5px] overflow-hidden rounded-full bg-[color:color-mix(in_oklab,var(--accent-ink)_22%,transparent)]">
              <div
                className="bg-accent-ink h-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center">
              <span className="text-[11.5px] font-bold text-[color:color-mix(in_oklab,var(--accent-ink)_65%,transparent)] tabular-nums">
                플래티넘까지 {applyDelta(ME.nextTierAt - score, 0)}점
              </span>
              <div className="flex-auto" />
              <span className="text-accent-ink text-[11.5px] font-extrabold tabular-nums">
                {ME.weeklyHit} / {ME.weeklyTotal} 적중
              </span>
            </div>
          </div>

          <div className="border-line flex flex-col gap-[13px] rounded-2xl border bg-card p-[17px]">
            <span className="text-ink-subtle text-[11.5px] font-bold">
              이번 주 소수 적중 랭킹
            </span>
            {RANKING.map((r) => (
              <div key={r.rank} className="flex items-center gap-2.5">
                <span
                  className={`w-3.5 text-xs font-extrabold tabular-nums ${
                    r.rank === 1 ? "text-accent" : "text-ink-subtle"
                  }`}
                >
                  {r.rank}
                </span>
                <span className="text-ink-muted flex-1 text-[13px] font-bold">
                  {r.name}
                </span>
                <span className="text-ink-muted text-[12.5px] font-extrabold tabular-nums">
                  +{r.gained}
                </span>
              </div>
            ))}
            <div className="bg-line h-px" />
            <div className="flex items-center gap-2.5">
              <span className="text-ink-subtle w-3.5 text-xs font-extrabold tabular-nums">
                {MY_RANK.rank}
              </span>
              <span className="flex-1 text-[13px] font-bold">
                {MY_RANK.name}
              </span>
              <span className="text-[12.5px] font-extrabold tabular-nums">
                +{MY_RANK.gained}
              </span>
            </div>
          </div>

          <div className="border-line-strong flex flex-col gap-[7px] rounded-2xl border border-dashed p-4">
            <span className="text-[12.5px] font-bold">돈은 걸지 않습니다</span>
            <span className="text-ink-subtle text-[11.5px] leading-[1.6] font-medium text-pretty">
              현금·코인·아이템 없이 신용도 점수와 티어만 오갑니다. 점수는 0점
              아래로 내려가지 않습니다.
            </span>
          </div>
        </aside>
      </div>
    </div>
  )
}
