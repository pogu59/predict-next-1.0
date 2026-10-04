"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { Swords } from "lucide-react"

import type { Issue } from "@/lib/api"
import { saveReturnTo } from "@/lib/auth"
import {
  buildChallengeUrl,
  challengeOutcome,
  saveChallenge,
  type Challenge,
} from "@/lib/challenge"
import { formatDateTime } from "@/lib/issues"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"

/** 받은 도전장 배너 — 이슈 상세 제목 위. 상태(열림·대결 중·판정 대기·확정)에 따라 문구가 바뀐다. */
export function ChallengeBanner({
  issue,
  challenge,
  loggedIn,
  open,
  className,
}: {
  issue: Issue
  challenge: Challenge
  loggedIn: boolean
  /** 마감 시각 기준으로 아직 걸 수 있는지(이슈 상세와 같은 판정). */
  open: boolean
  className?: string
}) {
  const router = useRouter()
  const { vs, pick } = challenge

  useEffect(() => {
    saveChallenge(issue.id, { vs, pick })
  }, [issue.id, vs, pick])

  const text = (id: number | null) =>
    issue.options.find((o) => o.id === id)?.text ?? ""
  const outcome = challengeOutcome(issue, pick, issue.myOptionId)
  const confirmed = issue.status === "CONFIRMED"

  let title: string
  let sub: string | null = null
  if (confirmed) {
    title = {
      win: `${vs}님을 이겼어요!`,
      lose: `${vs}님이 이겼어요`,
      both: "둘 다 맞혔어요",
      neither: "둘 다 빗나갔어요",
      "same-side": `${vs}님과 같은 편이었어요`,
      spectator: `정답은 '${text(issue.correctOptionId)}'이었어요`,
      pending: "",
      open: "",
    }[outcome]
    sub =
      outcome === "spectator"
        ? `${vs}님은 '${text(pick)}'을 골랐어요`
        : "친구 도전"
  } else if (!open) {
    title = "결과가 나오면 누가 이겼는지 알려드려요"
    sub = `${vs}님은 '${text(pick)}'을 골랐어요`
  } else if (outcome === "same-side") {
    title = `${vs}님과 같은 편이에요`
  } else if (outcome === "pending") {
    title = `${vs}님과 대결 중이에요 · ${formatDateTime(issue.voteDeadlineAt)} 마감`
  } else {
    title = `${vs}님은 '${text(pick)}'을 골랐어요`
    sub = "다른 쪽을 고르면 대결이 시작돼요"
  }

  function loginToReply() {
    saveReturnTo(window.location.pathname + window.location.search)
    router.push("/login")
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[18px] px-[18px] py-4 text-white",
        confirmed && outcome === "win" ? "bg-brand" : "bg-ink",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Swords className="mt-0.5 size-5 flex-none text-brand-on-dark" />
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-[15px] leading-[1.4] font-bold">{title}</span>
          {sub && <span className="text-[13px] text-white/70">{sub}</span>}
        </div>
      </div>
      {!loggedIn && open && (
        <button
          type="button"
          onClick={loginToReply}
          className="h-11 rounded-[13px] bg-white text-sm font-bold text-ink"
        >
          로그인하고 받아치기
        </button>
      )}
    </div>
  )
}

/** 내가 건 이슈에서 친구에게 도전장 링크를 보낸다. 공유 시트가 없으면 링크를 복사한다. */
export function SendChallengeButton({
  issue,
  nickname,
  className,
}: {
  issue: Issue
  nickname: string
  className?: string
}) {
  const showToast = useToast()
  const myOptionId = issue.myOptionId
  if (myOptionId == null) return null
  const pickText = issue.options.find((o) => o.id === myOptionId)?.text ?? ""

  async function send() {
    const url = buildChallengeUrl(
      window.location.origin,
      issue.id,
      nickname,
      myOptionId as number,
    )
    const text = `${nickname}님이 '${pickText}'을 골랐어요. 반대로 걸어볼래요?`
    if (navigator.share) {
      try {
        await navigator.share({ title: issue.title, text, url })
        return
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`)
      showToast("도전장 링크를 복사했어요")
    } catch {
      showToast("링크를 복사하지 못했어요")
    }
  }

  return (
    <button
      type="button"
      onClick={send}
      className={cn(
        "flex h-12 items-center justify-center gap-2 rounded-2xl bg-surface text-[15px] font-bold shadow-card",
        className,
      )}
    >
      <Swords className="size-[18px] text-brand" />
      친구에게 도전장 보내기
    </button>
  )
}
