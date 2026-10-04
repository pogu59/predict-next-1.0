"use client"

import Link from "next/link"
import { useMemo } from "react"

import { Hourglass, Radio } from "lucide-react"

import type { Issue } from "@/lib/api"
import { formatDateTime, useNow } from "@/lib/issues"
import { liveBuckets } from "@/lib/live"
import { useMe } from "@/lib/queries/auth"
import { useIssues } from "@/lib/queries/issue"
import { useMyVotes } from "@/lib/queries/user"
import { cn } from "@/lib/utils"
import { LiveCard } from "@/components/live-card"

/** 라이브 예측 — 경기 중 관리자가 연달아 여는 3~15분짜리 초단기 이슈를 한 화면에서 바로 건다. */
export default function LivePage() {
  const now = useNow().getTime()
  const { data: me } = useMe()
  const { data: issues = [], isLoading, error } = useIssues(me?.userId)
  const { data: myVotes = [] } = useMyVotes(me?.userId)
  const deltaByIssue = useMemo(
    () =>
      Object.fromEntries(
        myVotes.map((v) => [v.issueId, v.scoreDelta]),
      ) as Record<number, number | null>,
    [myVotes],
  )

  const { open, judging, finished } = liveBuckets(issues, now)
  const played = finished.filter((i) => i.myOptionId != null)
  const wins = played.filter((i) => i.myOptionId === i.correctOptionId).length

  return (
    <div className="pb-10 lg:mx-auto lg:max-w-[760px] lg:pb-0">
      <div className="flex items-center gap-2 px-5 pt-2 pb-4 lg:px-0 lg:pt-0 lg:pb-[18px]">
        <h1 className="text-2xl font-extrabold tracking-[-0.04em] lg:text-[30px]">
          라이브
        </h1>
        {open.length > 0 && (
          <span className="rounded-[7px] bg-danger-soft px-2 py-[5px] text-xs font-bold text-danger-ink tabular-nums">
            {open.length}개 진행 중
          </span>
        )}
      </div>

      <div className="flex flex-col gap-6 px-4 lg:px-0">
        {isLoading || error ? (
          <div className="py-[60px] text-center text-sm text-faint">
            {error ? error.message : "불러오는 중..."}
          </div>
        ) : open.length > 0 ? (
          <section className="flex flex-col gap-3">
            <SectionTitle>지금 열린 라이브</SectionTitle>
            {open.map((issue) => (
              <LiveCard key={issue.id} issue={issue} now={now} />
            ))}
          </section>
        ) : (
          <section className="flex flex-col items-start gap-2 rounded-3xl bg-surface p-6">
            <span className="grid size-12 place-items-center rounded-2xl bg-danger-soft text-danger-ink">
              <Radio className="size-6" />
            </span>
            <span className="pt-1 text-lg font-extrabold tracking-[-0.02em]">
              지금은 열린 라이브가 없어요
            </span>
            <span className="text-sm leading-[1.6] text-sub">
              경기 중에 짧은 예측이 연달아 열려요. 가을야구·롤드컵 경기 시간에
              들러주세요.
            </span>
            <Link
              href="/issue"
              className="mt-2 flex h-11 items-center rounded-[13px] bg-ink px-4 text-sm font-bold text-white"
            >
              진행 중인 예측 보기
            </Link>
          </section>
        )}

        {judging.length > 0 && (
          <section className="flex flex-col gap-3">
            <SectionTitle>판정 중</SectionTitle>
            <div className="flex flex-col rounded-3xl bg-surface px-5 py-1">
              {judging.map((issue, i) => (
                <ResultRow key={issue.id} issue={issue} first={i === 0}>
                  <span className="flex items-center gap-1 text-xs font-bold text-warn-ink">
                    <Hourglass className="size-3.5" />
                    판정 중
                  </span>
                </ResultRow>
              ))}
            </div>
          </section>
        )}

        {finished.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <SectionTitle>방금 끝난 라이브</SectionTitle>
              <span className="text-[13px] font-bold text-sub tabular-nums">
                오늘 라이브 {wins}승 {played.length - wins}패
              </span>
            </div>
            <div className="flex flex-col rounded-3xl bg-surface px-5 py-1">
              {finished.map((issue, i) => {
                const mine = issue.myOptionId
                const hit = mine != null && mine === issue.correctOptionId
                return (
                  <ResultRow key={issue.id} issue={issue} first={i === 0}>
                    <span
                      className={cn(
                        "rounded-[7px] px-2 py-[5px] text-xs font-bold tabular-nums",
                        hit ? "bg-brand text-white" : "bg-line-3 text-sub",
                      )}
                    >
                      {mine == null
                        ? "미참여"
                        : hit
                          ? `적중 +${deltaByIssue[issue.id] ?? 0}`
                          : "빗나감"}
                    </span>
                  </ResultRow>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-1 text-lg font-extrabold tracking-[-0.03em]">
      {children}
    </h2>
  )
}

function ResultRow({
  issue,
  first,
  children,
}: {
  issue: Issue
  first: boolean
  children: React.ReactNode
}) {
  const mine = issue.options.find((o) => o.id === issue.myOptionId)
  const answer = issue.options.find((o) => o.id === issue.correctOptionId)
  return (
    <Link
      href={`/issue/${issue.id}`}
      className={cn(
        "flex items-center gap-3 py-3.5",
        !first && "border-t border-line-3",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-[15px] font-bold">{issue.title}</span>
        <span className="truncate text-xs text-muted">
          {answer
            ? `정답 · ${answer.text}`
            : `${formatDateTime(issue.voteDeadlineAt)} 마감`}
          {mine && ` · 내 선택 ${mine.text}`}
        </span>
      </div>
      {children}
    </Link>
  )
}
