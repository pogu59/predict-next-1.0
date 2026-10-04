"use client"

import {
  AlarmClock,
  ArrowRight,
  BadgeCheck,
  Bell,
  BellRing,
  ChevronRight,
  CircleCheck,
  Flame,
  Gift,
  Heart,
  Hourglass,
  MessageCircle,
  MessageSquarePlus,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import type { Issue } from "@/lib/api"
import { DAY, issueChip, leadingOption, optionPercents, remainLabel } from "@/lib/issues"
import { TierIcon } from "@/lib/tier"
import { cn } from "@/lib/utils"
import { IssueCardFeatured } from "@/components/issue-card"
import { sortForFilter, useHotPosts, useIssueBuckets } from "@/components/issue-feed"
import { Chip, Logo } from "@/components/ui/brand"
import { LiveBanner } from "@/components/live-banner"
import { WrappedBanner } from "@/components/wrapped-banner"
import { ImageBox } from "@/components/ui/image-box"
import { useToast } from "@/components/ui/toast"

/**
 * 모바일 홈(허브) — 예측과 커뮤니티를 함께 보여주는 프리뷰 화면.
 * 섹션은 HOME_SECTIONS 순서대로 그리며, 각 섹션이 자기 쿼리·스켈레톤·빈 상태를 가진다(한 섹션이 비어도 나머지는 그대로).
 * 새 콘텐츠는 섹션 컴포넌트를 만들어 이 배열에 추가하면 된다.
 */
const HOME_SECTIONS: { key: string; Section: () => React.ReactNode }[] = [
  { key: "open", Section: OpenIssuesSection },
  { key: "soon", Section: ClosingSoonSection },
  { key: "posts", Section: HotPostsSection },
  { key: "results", Section: RecentResultsSection },
  { key: "welcome-credit", Section: AllEmptyNotice },
]

export function HomeHub() {
  return (
    <div className="flex flex-col gap-7 pb-[110px] lg:hidden">
      <HubHeader />
      <WrappedBanner className="mx-4 -mt-3" />
      <LiveBanner className="mx-4 -mt-3" />
      {HOME_SECTIONS.map(({ key, Section }) => (
        <Section key={key} />
      ))}
    </div>
  )
}

function HubHeader() {
  const { me } = useIssueBuckets()
  return (
    <div className="flex items-center justify-between px-5 pt-2">
      <Logo />
      <div className="flex items-center gap-1.5">
        <Bell className="box-content size-[22px] p-1.5 text-[#4A4A50]" />
        {me ? (
          <Link
            href="/my"
            className="flex items-center gap-1.5 rounded-full bg-surface py-1.5 pr-3 pl-[7px] shadow-[0_1px_2px_rgba(0,0,0,.05)]"
          >
            <TierIcon tier={me.tier} size={20} />
            <span className="text-sm font-bold tabular-nums">{me.credibilityScore.toLocaleString()}</span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="rounded-full bg-surface px-3 py-1.5 text-sm font-bold shadow-[0_1px_2px_rgba(0,0,0,.05)]"
          >
            로그인
          </Link>
        )}
      </div>
    </div>
  )
}

function SectionHeader({
  Icon,
  iconClass,
  title,
  href,
}: {
  Icon: LucideIcon
  iconClass: string
  title: string
  href?: string
}) {
  return (
    <div className="flex items-center gap-[7px] px-5 pb-2.5">
      <Icon className={cn("size-[18px]", iconClass)} />
      <h2 className="text-lg font-extrabold tracking-[-0.03em]">{title}</h2>
      <span className="flex-1" />
      {href && (
        <Link href={href} className="flex items-center gap-px text-[13px] font-semibold text-muted">
          전체 보기
          <ChevronRight className="size-[15px]" />
        </Link>
      )}
    </div>
  )
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-line-3", className)} />
}

/** 지금 열린 예측 — 24h 이상 남은 것을 먼저, 마감 빠른 순으로 최대 4개. 끝에 "n개 전체" 점선 카드. */
function OpenIssuesSection() {
  const { now, buckets, deltaByIssue, isLoading, error } = useIssueBuckets()
  const nowMs = now.getTime()
  const sorted = sortForFilter(buckets.open, "open")
  const isSoon = (i: Issue) => Date.parse(i.voteDeadlineAt) - nowMs < DAY
  const featured = [...sorted.filter((i) => !isSoon(i)), ...sorted.filter(isSoon)].slice(0, 4)

  return (
    <section className="flex flex-col">
      <SectionHeader Icon={Sparkles} iconClass="text-brand" title="지금 열린 예측" href="/issue?filter=open" />
      {isLoading ? (
        <div className="flex gap-3 overflow-hidden px-5">
          <Skeleton className="h-[262px] w-[286px] flex-none rounded-3xl" />
          <Skeleton className="h-[262px] w-[286px] flex-none rounded-3xl" />
        </div>
      ) : error ? (
        <div className="py-10 text-center text-sm text-faint">{error.message}</div>
      ) : featured.length > 0 ? (
        <div className="flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 [scrollbar-width:none]">
          {featured.map((issue) => (
            <IssueCardFeatured key={issue.id} issue={issue} now={now} scoreDelta={deltaByIssue[issue.id]} />
          ))}
          <Link
            href="/issue?filter=open"
            className="flex w-[120px] flex-none snap-start flex-col items-center justify-center gap-2 rounded-3xl border-[1.5px] border-dashed border-[#DCDCD9] text-sub"
          >
            <span className="grid size-11 place-items-center rounded-full bg-surface">
              <ArrowRight className="size-5" />
            </span>
            <span className="text-[13px] font-bold">{buckets.open.length}개 전체</span>
          </Link>
        </div>
      ) : (
        <NoOpenIssues />
      )}
    </section>
  )
}

function NoOpenIssues() {
  const showToast = useToast()
  const [notified, setNotified] = useState(false)

  function notifyMe() {
    if (notified) return
    // TODO: 새 이슈 알림 신청 API(POST /api/notifications/new-topic)가 생기면 연결한다.
    setNotified(true)
    showToast("새 이슈가 열리면 알려드릴게요")
  }

  return (
    <div className="mx-4 flex flex-col overflow-hidden rounded-3xl bg-surface">
      <ImageBox className="h-[150px]" iconSize={28} />
      <div className="flex flex-col items-start gap-1.5 px-5 pt-[18px] pb-5">
        <span className="text-lg font-extrabold tracking-[-0.02em]">다음 예측을 준비하고 있어요</span>
        <span className="text-sm leading-[1.6] text-sub">
          새 이슈가 열리면 가장 먼저 알려드릴게요. 그동안 지난 결과와 커뮤니티를 둘러보세요.
        </span>
        <button
          type="button"
          onClick={notifyMe}
          className={cn(
            "mt-2.5 flex h-11 items-center gap-1.5 rounded-[13px] px-4 text-sm font-bold",
            notified ? "bg-track text-ink" : "bg-ink text-white",
          )}
        >
          {notified ? <BellRing className="size-[17px]" /> : <Bell className="size-[17px]" />}
          {notified ? "알림 신청 완료" : "새 이슈 알림 받기"}
        </button>
      </div>
    </div>
  )
}

/** 곧 마감돼요 — 24h 미만 남은 진행 중 이슈. 없으면 섹션째 숨긴다. */
function ClosingSoonSection() {
  const { now, buckets } = useIssueBuckets()
  if (buckets.soon.length === 0) return null
  const soon = sortForFilter(buckets.soon, "soon")

  return (
    <section className="flex flex-col">
      <SectionHeader Icon={AlarmClock} iconClass="text-danger-ink" title="곧 마감돼요" />
      <div className="mx-4 rounded-[22px] bg-surface px-4 py-1">
        {soon.map((issue, i) => {
          const lead = leadingOption(issue.options)
          const pct = optionPercents(issue.options)
          return (
            <Link
              key={issue.id}
              href={`/issue/${issue.id}`}
              className={cn("flex items-center gap-3 py-3", i > 0 && "border-t border-line-3")}
            >
              <ImageBox src={issue.coverImageUrl} className="size-11 flex-none rounded-xl" iconSize={16} />
              <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="truncate text-sm font-bold">{issue.title}</span>
                {lead && (
                  <span className="text-xs font-semibold text-muted">
                    선두 · {lead.text} {pct[lead.id]}%
                  </span>
                )}
              </div>
              <Chip className="flex-none bg-danger-soft text-danger-ink">
                {remainLabel(Date.parse(issue.voteDeadlineAt) - now.getTime())}
              </Chip>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function HotPostsSection() {
  const { posts, isLoading } = useHotPosts()

  return (
    <section className="flex flex-col">
      <SectionHeader Icon={Flame} iconClass="text-danger" title="커뮤니티 인기글" href="/board" />
      {isLoading ? (
        <div className="mx-4 flex flex-col gap-4 rounded-[22px] bg-surface p-4">
          {[0, 1, 2].map((k) => (
            <Skeleton key={k} className="h-10 rounded-lg" />
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="mx-4 rounded-[22px] bg-surface px-4 py-1">
          {posts.map((p, i) => (
            <Link
              key={p.id}
              href={`/board/${p.id}`}
              className={cn("flex items-center gap-3 py-3.5", i > 0 && "border-t border-line-3")}
            >
              <span className="w-3.5 flex-none text-[15px] font-extrabold text-brand">{i + 1}</span>
              <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
                <span className="text-sm leading-[1.4] font-bold">{p.title}</span>
                <span className="flex items-center gap-[9px] text-xs text-faint">
                  <span>{p.authorNickname}</span>
                  <span className="flex items-center gap-0.5">
                    <Heart className="size-3" />
                    {p.likeCount}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <MessageCircle className="size-3" />
                    {p.replyCount}
                  </span>
                </span>
              </div>
              {p.thumbnailUrl && (
                <ImageBox src={p.thumbnailUrl} className="size-[52px] flex-none rounded-xl" iconSize={18} />
              )}
            </Link>
          ))}
        </div>
      ) : (
        <Link href="/board/write" className="mx-4 flex items-center gap-3.5 rounded-[22px] bg-surface p-5">
          <span className="grid size-12 flex-none place-items-center rounded-[15px] bg-[#FFF0E8] text-[#F06B2C]">
            <MessageSquarePlus className="size-[22px]" />
          </span>
          <div className="flex flex-1 flex-col gap-[3px]">
            <span className="text-[15px] font-bold">첫 이야기를 시작해 보세요</span>
            <span className="text-[13px] text-muted">예측 근거, 정보, 잡담 무엇이든 좋아요</span>
          </div>
          <ChevronRight className="size-[18px] text-disabled-ink" />
        </Link>
      )}
    </section>
  )
}

/** 최근 결과 — 최근 마감된 결과 대기·확정 이슈 2개. 없으면 섹션째 숨긴다. */
function RecentResultsSection() {
  const { now, buckets, deltaByIssue } = useIssueBuckets()
  const results = sortForFilter(buckets.result, "result").slice(0, 2)
  if (results.length === 0) return null

  return (
    <section className="flex flex-col">
      <SectionHeader Icon={BadgeCheck} iconClass="text-success" title="최근 결과" href="/issue?filter=result" />
      <div className="grid grid-cols-2 gap-2.5 px-4">
        {results.map((issue) => {
          const chip = issueChip(issue, { optionId: issue.myOptionId, scoreDelta: deltaByIssue[issue.id] }, now)
          const confirmed = issue.status === "CONFIRMED"
          const answer = issue.options.find((o) => o.id === issue.correctOptionId)
          return (
            <Link
              key={issue.id}
              href={`/issue/${issue.id}`}
              className="flex flex-col gap-2.5 rounded-[20px] bg-surface p-3.5"
            >
              <Chip className={cn("self-start rounded-md px-[7px] py-1 text-[11px]", chip.className)}>
                {chip.label}
              </Chip>
              <span className="line-clamp-2 min-h-[39px] text-sm leading-[1.4] font-bold">{issue.title}</span>
              <span className="flex items-center gap-1 truncate text-xs font-semibold text-sub">
                {confirmed ? (
                  <CircleCheck className="size-[13px] flex-none text-brand" />
                ) : (
                  <Hourglass className="size-[13px] flex-none text-warn-ink" />
                )}
                <span className="truncate">{confirmed ? `정답 · ${answer?.text ?? ""}` : "결과 확정 대기 중"}</span>
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

/** 열린 이슈도 결과도 없을 때 — 가입 신용도를 상기시키는 안내 카드. */
function AllEmptyNotice() {
  const { me, buckets, isLoading, error } = useIssueBuckets()
  if (isLoading || error || !me || buckets.open.length > 0 || buckets.result.length > 0) return null

  return (
    <div className="mx-4 flex items-center gap-3.5 rounded-[22px] bg-brand-soft px-5 py-[18px]">
      <Gift className="size-6 text-brand" />
      <div className="flex flex-1 flex-col gap-[3px]">
        <span className="text-[15px] font-bold text-[#3A2BD8]">
          신용도 {me.credibilityScore.toLocaleString()}이 준비돼 있어요
        </span>
        <span className="text-[13px] text-brand">첫 이슈가 열리면 바로 걸어보세요</span>
      </div>
    </div>
  )
}
