"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import { ImageDown, X } from "lucide-react"

import { useCredit } from "@/lib/credit"
import { ARCHETYPES } from "@/lib/insights"
import { formatDate } from "@/lib/issues"
import { useMe } from "@/lib/queries/auth"
import { useIssues } from "@/lib/queries/issue"
import { renderShareCard, shareOrDownload } from "@/lib/share-card"
import { cn } from "@/lib/utils"
import { buildWrapped, WRAPPED_MIN_VOTES, type Wrapped } from "@/lib/wrapped"
import { useToast } from "@/components/ui/toast"

type Tone = "brand" | "ink" | "surface"
type Slide = { key: string; body: React.ReactNode }

const TONES: Tone[] = ["brand", "ink", "surface"]
const TONE_CLASS: Record<Tone, string> = {
  brand: "bg-brand text-white",
  ink: "bg-ink text-white",
  surface: "bg-surface text-ink",
}

function Big({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "text-[64px] leading-none font-extrabold tracking-[-0.05em] tabular-nums",
        className,
      )}
    >
      {children}
    </span>
  )
}

function Lead({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-lg leading-[1.5] font-semibold opacity-80">
      {children}
    </span>
  )
}

function IssueTitle({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[26px] leading-[1.35] font-extrabold tracking-[-0.03em] text-pretty">
      {children}
    </span>
  )
}

/** 2026 내 촉 결산 — 한 장씩 넘기는 스토리. 오른쪽 2/3·→·Space 다음, 왼쪽 1/3·← 이전, Esc·X는 마이로. */
export default function WrappedPage() {
  const router = useRouter()
  const { isLoading: meLoading } = useMe()
  const { me, votes, credit } = useCredit()
  const { data: issues = [] } = useIssues(me?.userId)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!meLoading && !me) router.replace("/login")
  }, [meLoading, me, router])

  const w = buildWrapped(votes, issues)
  const slides = me
    ? buildSlides(w, me.nickname, {
        nickname: me.nickname,
        tier: me.tier,
        credit,
      })
    : []
  const last = slides.length - 1

  const go = useCallback(
    (delta: number) =>
      setIndex((i) => Math.min(Math.max(i + delta, 0), Math.max(last, 0))),
    [last],
  )
  const exit = useCallback(() => router.push("/my"), [router])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault()
        go(1)
      } else if (e.key === "ArrowLeft") go(-1)
      else if (e.key === "Escape") exit()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [go, exit])

  if (!me || slides.length === 0) return null

  const current = Math.min(index, last)
  // 마지막(공유) 장이 항상 brand가 되도록 끝에서부터 brand → ink → surface를 번갈아 칠한다.
  const toneOf = (i: number) => TONES[(last - i) % TONES.length]
  const tone = toneOf(current)

  function onTap(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("a,button")) return
    const rect = e.currentTarget.getBoundingClientRect()
    go(e.clientX - rect.left < rect.width / 3 ? -1 : 1)
  }

  return (
    <div className="fixed inset-0 z-40 bg-bg lg:static lg:z-auto lg:flex lg:justify-center lg:bg-transparent">
      <div
        onClick={onTap}
        className={cn(
          "relative flex h-dvh w-full cursor-pointer flex-col px-6 pt-5 pb-10 select-none motion-safe:transition-colors motion-safe:duration-300",
          "lg:h-[740px] lg:w-[420px] lg:rounded-[32px] lg:shadow-modal",
          TONE_CLASS[tone],
        )}
      >
        <div className="flex gap-1">
          {slides.map((s, i) => (
            <span
              key={s.key}
              className={cn(
                "h-[3px] flex-1 rounded-full",
                tone === "surface" ? "bg-ink/15" : "bg-white/25",
                i <= current && (tone === "surface" ? "bg-ink" : "bg-white"),
              )}
            />
          ))}
        </div>
        <div className="flex justify-end pt-3">
          <button
            type="button"
            onClick={exit}
            aria-label="닫기"
            className="-mr-2 p-2"
          >
            <X className="size-6" />
          </button>
        </div>
        <div
          key={slides[current].key}
          className="flex flex-1 flex-col justify-center gap-5 motion-safe:animate-fade-in"
        >
          {slides[current].body}
        </div>
        <span className="text-center text-xs font-semibold tabular-nums opacity-50">
          {current + 1} / {slides.length}
        </span>
      </div>
    </div>
  )
}

function buildSlides(
  w: Wrapped,
  nickname: string,
  card: { nickname: string; tier: string; credit: number },
): Slide[] {
  const intro: Slide = {
    key: "intro",
    body: (
      <>
        <Lead>{nickname}님의</Lead>
        <span className="text-[44px] leading-[1.2] font-extrabold tracking-[-0.045em]">
          {w.year} 예측
        </span>
        <Lead>한 해 동안 {w.total}번 촉을 세웠어요</Lead>
      </>
    ),
  }
  const outro: Slide = {
    key: "outro",
    body: (
      <>
        <span className="text-[34px] leading-[1.3] font-extrabold tracking-[-0.04em]">
          {w.total < WRAPPED_MIN_VOTES
            ? "내년엔 더 많이 맞혀봐요"
            : "2027에도 같이 맞혀봐요"}
        </span>
        {w.total >= WRAPPED_MIN_VOTES && (
          <WrappedShareButton wrapped={w} card={card} />
        )}
        <Link
          href="/issue"
          className="flex h-[52px] items-center justify-center rounded-2xl bg-white/15 text-[15px] font-bold"
        >
          진행 중인 예측 보기
        </Link>
      </>
    ),
  }
  if (w.total < WRAPPED_MIN_VOTES) return [intro, outro]

  const slides: Slide[] = [intro]
  if (w.firstVote) {
    slides.push({
      key: "first",
      body: (
        <>
          <Lead>{formatDate(w.firstVote.votedAt)}, 처음 고른 예측은</Lead>
          <IssueTitle>{w.firstVote.title}</IssueTitle>
        </>
      ),
    })
  }
  if (w.bestHit) {
    slides.push({
      key: "best",
      body: (
        <>
          <Lead>가장 짜릿했던 적중</Lead>
          <Big>+{w.bestHit.delta}</Big>
          <span className="text-lg font-bold">
            {w.bestHit.pct}%만 고른 쪽을 맞혔어요
          </span>
          <IssueTitle>{w.bestHit.title}</IssueTitle>
        </>
      ),
    })
  }
  if (w.worstMiss) {
    slides.push({
      key: "worst",
      body: (
        <>
          <Lead>가장 아팠던 빗나감</Lead>
          <span className="text-2xl font-extrabold tracking-[-0.03em]">
            {w.worstMiss.pct}%가 고른 쪽이었는데…
          </span>
          <IssueTitle>{w.worstMiss.title}</IssueTitle>
          <Big className="opacity-80">{w.worstMiss.delta}</Big>
        </>
      ),
    })
  }
  slides.push({
    key: "streak",
    body: (
      <>
        <Lead>최장</Lead>
        <Big>{w.bestStreak}연속 적중</Big>
        <span className="text-lg font-bold">
          소수 의견 적중 {w.minorityHits}번
        </span>
      </>
    ),
  })
  slides.push({
    key: "crowd",
    body: (
      <>
        <div className="flex flex-col gap-1">
          <Lead>내 적중률</Lead>
          <Big>{w.myAccuracy ?? 0}%</Big>
        </div>
        <span className="text-lg font-bold opacity-60">vs</span>
        <div className="flex flex-col gap-1">
          <Lead>올해 다수의 감</Lead>
          <Big className="opacity-80">{w.crowdAccuracy ?? 0}%</Big>
        </div>
        {(w.myAccuracy ?? 0) > (w.crowdAccuracy ?? 0) && (
          <span className="text-lg font-bold">
            올해는 다수보다 촉이 좋았어요
          </span>
        )}
      </>
    ),
  })
  slides.push({
    key: "dna",
    body: (
      <>
        <Lead>{nickname}님은</Lead>
        <span className="text-[44px] leading-[1.2] font-extrabold tracking-[-0.045em]">
          {ARCHETYPES[w.dna.archetype].name}
        </span>
        <span className="text-[17px] leading-[1.6] opacity-80">
          {ARCHETYPES[w.dna.archetype].summary}
        </span>
      </>
    ),
  })
  slides.push(outro)
  return slides
}

function WrappedShareButton({
  wrapped,
  card,
}: {
  wrapped: Wrapped
  card: { nickname: string; tier: string; credit: number }
}) {
  const showToast = useToast()
  const [busy, setBusy] = useState(false)

  async function share() {
    setBusy(true)
    try {
      const blob = await renderShareCard({
        ...card,
        dna: wrapped.dna,
        variant: "wrapped",
        wrapped: {
          year: wrapped.year,
          total: wrapped.total,
          accuracy: wrapped.myAccuracy,
          bestDelta: wrapped.bestHit?.delta ?? null,
        },
      })
      const result = await shareOrDownload(
        blob,
        `predict-wrapped-${wrapped.year}.png`,
      )
      if (result === "saved") showToast("공유 카드를 저장했어요")
    } catch {
      showToast("공유 카드를 만들지 못했어요")
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      disabled={busy}
      className="flex h-[54px] items-center justify-center gap-2 rounded-2xl bg-white text-[15px] font-bold text-ink disabled:opacity-60"
    >
      <ImageDown className="size-5" />
      공유 카드 만들기
    </button>
  )
}
