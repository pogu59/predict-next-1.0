"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { Coins } from "lucide-react"

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
import { useMe } from "@/lib/queries/auth"
import { useCategories } from "@/lib/queries/category"
import { useCastVote, useCreateIssueReply, useDeleteIssueReply, useIssue, useIssueReplies } from "@/lib/queries/issue"
import { tierIcon, tierLabel, tierProgress } from "@/lib/tier"
import { Icon } from "@/components/icon"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ReplySection } from "@/components/replies/replySection"

export default function IssueDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const issueId = Number(params.id)
  const now = useNow()

  const { data: me } = useMe()
  const { data: categories = [] } = useCategories()
  const { data: issue, isLoading: issueLoading, error: issueError } = useIssue(issueId, me?.userId)
  const { data: replies = [] } = useIssueReplies(issueId, issue?.status !== "CONFIRMED")

  const castVote = useCastVote(issueId)
  const createReply = useCreateIssueReply(issueId)
  const deleteReply = useDeleteIssueReply(issueId)

  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [selectedOption, setSelectedOption] = useState<{
    optionId: number
    optionText: string
  } | null>(null)
  const [stakeInput, setStakeInput] = useState("")
  const [confirmingVote, setConfirmingVote] = useState(false)

  async function handleReplySubmit(content: string) {
    await createReply.mutateAsync(content)
  }

  async function handleReplyDelete(replyId: number) {
    await deleteReply.mutateAsync(replyId)
  }

  function handleOptionSelect(optionId: number, optionText: string) {
    if (!me) {
      setShowLoginPrompt(true)
      return
    }
    setSelectedOption({ optionId, optionText })
    setStakeInput("")
  }

  function confirmVote() {
    if (!me || !selectedOption || !stakeValid) return
    castVote.mutate(
      { userId: me.userId, optionId: selectedOption.optionId, stake },
      {
        onSuccess: () => {
          setConfirmingVote(false)
          setSelectedOption(null)
        },
      },
    )
  }

  if (issueLoading) {
    return (
      <div className="flex flex-col gap-[22px] px-6 pt-8 pb-11">
        <div className="text-label text-ink-subtle">불러오는 중...</div>
      </div>
    )
  }

  if (issueError || !issue) {
    return (
      <div className="flex flex-col gap-[22px] px-6 pt-8 pb-11">
        <div className="rounded-xl border border-dashed border-line-strong px-5 py-10 text-center text-label text-ink-subtle">
          {issueError?.message ?? "존재하지 않는 이슈입니다"}
        </div>
      </div>
    )
  }

  const status = issueStatus(issue)
  const categoryName =
    categories.find((c) => c.id === issue.categoryId)?.name ?? ""
  const cat = categoryMeta(categoryName)
  const myOptionId = issue.myOptionId ?? undefined
  const myOption = issue.options.find((o) => o.id === myOptionId)
  const correctOption = issue.options.find(
    (o) => o.id === issue.correctOptionId,
  )
  const settled = status === "settled"
  const notStarted = status === "open" && !hasVotingStarted(issue, now)
  const ratio = status === "open" ? undefined : voteRatio(issue.options)
  const totalVotes =
    status === "open" ? undefined : totalVoteCount(issue.options)
  const minorityPct =
    ratio && myOptionId !== undefined ? ratio[myOptionId] : undefined
  const result = settled ? settlementResult(issue) : undefined

  const score = me?.credibilityScore ?? 0
  const progress = tierProgress(score)
  const stake = Number(stakeInput)
  const stakeValid = Number.isInteger(stake) && stake >= 1 && stake <= score

  return (
    <div className="flex flex-col gap-[22px] px-4 pt-8 pb-11 sm:px-6">
      <div className="mx-auto flex w-full max-w-[1050px] flex-col gap-6 lg:flex-row lg:gap-[30px]">
        <div className="flex w-full flex-col gap-[14px] lg:max-w-[760px]">
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
            <button
              type="button"
              onClick={() => router.push("/issue")}
              className="flex items-center gap-1.5 text-label text-ink-subtle hover:text-ink"
            >
              <Icon name="arrow_back" filled={false} size={18} />
              오늘의 예측
            </button>
            <div className="flex-auto" />
            {totalVotes !== undefined && (
              <span className="text-caption text-ink-subtle tabular-nums">
                {totalVotes.toLocaleString()}명 참여
              </span>
            )}
            {(status === "open" || status === "voted") && (
              <span
                className={`rounded-md px-2.5 py-1.5 text-caption font-extrabold tabular-nums ${
                  !notStarted && isUrgent(issue.voteDeadlineAt, now)
                    ? "bg-[color:color-mix(in_oklab,var(--accent)_14%,transparent)] text-accent"
                    : "bg-control text-ink-subtle"
                }`}
              >
                {notStarted
                  ? formatRemaining(issue.voteStartAt, now)
                  : formatRemaining(issue.voteDeadlineAt, now)}
              </span>
            )}
            <span
              className={`inline-flex items-center gap-[5px] rounded-full px-2.5 py-1.5 text-caption font-extrabold ${stageBadgeClass(status, notStarted)}`}
            >
              {status === "pending" && <Icon name="hourglass_top" filled={false} size={14} />}
              {stageLabel(status, notStarted)}
            </span>
          </div>

          <div className="flex flex-col gap-[18px] rounded-2xl border border-line bg-card p-6">
            <div className="flex items-center gap-2">
              <Icon name={cat.icon} size={16} style={{ color: cat.color }} />
              <span className="text-label" style={{ color: cat.color }}>
                {categoryName}
              </span>
            </div>

            <h1 className="text-h1 text-pretty">{issue.title}</h1>

            {status === "open" ? (
              <div className="flex flex-col gap-3">
                {notStarted && (
                  <span className="text-caption text-ink-subtle tabular-nums">
                    {formatRemaining(issue.voteStartAt, now)} 뒤 투표가 시작돼요
                  </span>
                )}
                <div className="flex flex-col gap-3">
                  {issue.options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      disabled={notStarted}
                      onClick={() => handleOptionSelect(option.id, option.text)}
                      className={`rounded-xl border py-5 text-h2 transition-colors ${
                        notStarted
                          ? "cursor-not-allowed border-line bg-sunken text-ink-faint"
                          : selectedOption?.optionId === option.id
                            ? "border-accent text-accent bg-control"
                            : "border-line bg-control text-ink hover:border-accent hover:text-accent"
                      }`}
                    >
                      {option.text}
                    </button>
                  ))}
                </div>

                {notStarted ? null : selectedOption ? (
                  <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-sunken p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-label text-ink">
                        &ldquo;{selectedOption.optionText}&rdquo;에 얼마를 베팅할까요?
                      </span>
                      <span className="flex items-center gap-1 text-caption text-ink-subtle tabular-nums">
                        <Coins size={13} />
                        보유 {score.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={score}
                        value={stakeInput}
                        onChange={(e) => setStakeInput(e.target.value)}
                        placeholder="베팅할 신용도"
                        className="w-full rounded-lg border border-line bg-control px-3.5 py-2.5 text-label text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
                      />
                      {[25, 50, 100].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setStakeInput(String(Math.max(1, Math.floor((score * pct) / 100))))}
                          className="flex-none rounded-lg border border-line-strong px-3 py-2.5 text-caption text-ink-muted hover:text-ink"
                        >
                          {pct === 100 ? "전액" : `${pct}%`}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={!stakeValid}
                      onClick={() => setConfirmingVote(true)}
                      className="rounded-lg bg-accent px-4 py-2.5 text-label font-semibold text-accent-ink transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
                    >
                      베팅하기
                    </button>
                  </div>
                ) : (
                  <span className="text-caption text-ink-faint">
                    선택지를 고르면 베팅액을 정할 수 있어요 · 투표하면 실시간 비율이 공개됩니다
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {issue.options.map((option) => {
                  const pct = ratio?.[option.id] ?? 0
                  const isMine = option.id === myOptionId
                  const isCorrect =
                    settled && option.id === issue.correctOptionId
                  const barColor = isMine ? "bg-accent" : "bg-info"
                  return (
                    <div
                      key={option.id}
                      className={`flex flex-col gap-2.5 rounded-xl border p-4 ${
                        isCorrect || isMine
                          ? "border-accent"
                          : "border-line-strong"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-h3">{option.text}</span>
                        {isMine && (
                          <span className="rounded-md bg-accent px-1.5 py-1 text-caption leading-none text-accent-ink">
                            내 선택 · {issue.myStake?.toLocaleString()}점 베팅
                          </span>
                        )}
                        {isCorrect && (
                          <span className="rounded-md bg-accent px-1.5 py-1 text-caption leading-none text-accent-ink">
                            정답
                          </span>
                        )}
                        <div className="flex-auto" />
                        <span className="text-h3 tabular-nums">{pct}%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-track">
                        <div
                          className={`h-full rounded-full ${barColor}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}

                {status === "voted" &&
                  minorityPct !== undefined &&
                  minorityPct < 50 && (
                    <span className="text-caption text-accent tabular-nums">
                      {minorityPct}%만 이쪽 · 소수 의견입니다
                    </span>
                  )}

                {status === "pending" && (
                  <span className="text-caption text-ink-subtle">
                    {myOption
                      ? `결과 판정 예정 · 내 선택 ${myOption.text} (${issue.myStake?.toLocaleString()}점)`
                      : "결과 판정 예정"}
                  </span>
                )}

                {settled && (
                  <span
                    className={`text-label ${result === "correct" ? "text-success" : "text-ink-muted"}`}
                  >
                    {result === "correct"
                      ? "맞혔어요"
                      : result === "wrong"
                        ? "아쉽게 틀렸어요"
                        : "결과가 확정됐어요"}
                    {correctOption && ` · 정답 ${correctOption.text}`}
                  </span>
                )}
              </div>
            )}
          </div>

          <ReplySection
            replies={replies}
            currentUserId={me?.userId}
            onSubmit={handleReplySubmit}
            onDelete={handleReplyDelete}
            onRequireLogin={() => setShowLoginPrompt(true)}
          />
        </div>

        <aside className="flex w-full flex-col gap-[13px] lg:w-[290px] lg:flex-none">
          {me ? (
            <div className="flex flex-col gap-3 rounded-2xl bg-accent p-[17px]">
              <span className="flex items-center text-caption text-[color:color-mix(in_oklab,var(--accent-ink)_62%,transparent)]">
                내 신용도 · {tierLabel(me.tier)} {tierIcon(me.tier)}
              </span>
              <span className="text-title1 text-accent-ink tabular-nums">
                {score.toLocaleString()}
              </span>
              <div className="h-[5px] overflow-hidden rounded-full bg-[color:color-mix(in_oklab,var(--accent-ink)_22%,transparent)]">
                <div
                  className="h-full bg-accent-ink"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              {progress.nextTier && (
                <span className="text-caption text-[color:color-mix(in_oklab,var(--accent-ink)_65%,transparent)] tabular-nums">
                  {tierLabel(progress.nextTier)}까지 {progress.nextAt! - score}
                  점
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-line-strong p-[17px]">
              <span className="text-label">로그인하고 참여해보세요</span>
              <a href="/login" className="text-caption text-accent">
                로그인하러 가기
              </a>
            </div>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmingVote}
        onOpenChange={(open) => !open && setConfirmingVote(false)}
        title="이 선택에 베팅할까요?"
        description={`"${selectedOption?.optionText}"에 ${stake.toLocaleString()}점을 겁니다 · 베팅 후에는 선택을 바꾸거나 취소할 수 없어요.`}
        confirmLabel="베팅하기"
        loading={castVote.isPending}
        error={castVote.error?.message ?? null}
        onConfirm={confirmVote}
      />

      <ConfirmDialog
        open={showLoginPrompt}
        onOpenChange={setShowLoginPrompt}
        title="로그인이 필요해요"
        description="로그인하면 투표에 참여하고 신용도 점수를 쌓을 수 있어요."
        confirmLabel="로그인하러 가기"
        cancelLabel="닫기"
        onConfirm={() => router.push("/login")}
      />
    </div>
  )
}
