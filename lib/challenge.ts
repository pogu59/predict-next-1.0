import type { Issue } from "@/lib/api"

/**
 * 1:1 도전장(MVP) — 내 선택을 URL 파라미터(vs, pick)에 담아 보낸다. 링크는 누구나 고칠 수 있으므로
 * 화면에서는 "공식 전적"이 아니라 "친구 도전"으로만 다룬다.
 */

const STORAGE_KEY = "challenges"
const MAX_SAVED = 50
const MAX_NICKNAME = 20

export type Challenge = { vs: string; pick: number }
export type SavedChallenge = Challenge & { issueId: number; savedAt: number }

export type ChallengeOutcome =
  | "win"
  | "lose"
  | "both"
  | "neither"
  | "same-side"
  | "spectator"
  | "pending"
  | "open"

export function buildChallengeUrl(
  origin: string,
  issueId: number,
  nickname: string,
  optionId: number,
) {
  return `${origin}/issue/${issueId}?vs=${encodeURIComponent(nickname)}&pick=${optionId}`
}

/** vs는 1~20자, pick은 이 이슈의 선택지 id일 때만 유효. 내 닉네임이 보낸 링크(자기 링크)는 무시한다. */
export function parseChallenge(
  searchParams: { get(name: string): string | null },
  issue: Pick<Issue, "options">,
  myNickname?: string,
): Challenge | null {
  const vs = searchParams.get("vs")?.trim() ?? ""
  const pick = Number(searchParams.get("pick"))
  if (!vs || vs.length > MAX_NICKNAME) return null
  if (!Number.isInteger(pick) || !issue.options.some((o) => o.id === pick))
    return null
  if (myNickname && vs === myNickname) return null
  return { vs, pick }
}

/**
 * 확정 전: 내가 안 걸었으면 "open", 같은 쪽이면 "same-side", 다른 쪽이면 "pending".
 * 확정 후: 안 걸었으면 "spectator", 같은 쪽이면 "same-side", 아니면 정답 기준 win/lose/both/neither.
 */
export function challengeOutcome(
  issue: Pick<Issue, "status" | "correctOptionId">,
  pick: number,
  myOptionId: number | null | undefined,
): ChallengeOutcome {
  if (myOptionId != null && myOptionId === pick) return "same-side"
  if (issue.status !== "CONFIRMED")
    return myOptionId == null ? "open" : "pending"
  if (myOptionId == null) return "spectator"
  const meRight = myOptionId === issue.correctOptionId
  const themRight = pick === issue.correctOptionId
  if (meRight && themRight) return "both"
  if (meRight) return "win"
  if (themRight) return "lose"
  return "neither"
}

export function readChallenges(): SavedChallenge[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")
    return Array.isArray(parsed)
      ? parsed.filter(
          (c): c is SavedChallenge =>
            typeof c?.issueId === "number" &&
            typeof c?.vs === "string" &&
            typeof c?.pick === "number",
        )
      : []
  } catch {
    return []
  }
}

/** 같은 issueId + vs는 덮어쓰고, 최신 순으로 최대 50개만 남긴다. */
export function saveChallenge(issueId: number, challenge: Challenge) {
  try {
    const rest = readChallenges().filter(
      (c) => !(c.issueId === issueId && c.vs === challenge.vs),
    )
    const next = [
      { issueId, ...challenge, savedAt: Date.now() },
      ...rest,
    ].slice(0, MAX_SAVED)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // 저장이 막혀도 도전장 배너는 그대로 보인다.
  }
}
