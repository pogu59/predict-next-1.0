import Image from "next/image"

/**
 * 티어 라벨/구간표. TierPolicy.fromScore(predict 백엔드, docs/predict.md 3-1절)와 동일한 경계값을 쓴다.
 * 서버는 Tier enum을 이름 그대로("GOLD" 등) 내려주므로 한글 라벨은 프론트에서 매핑한다.
 */
export const TIER_LABELS: Record<string, string> = {
  UNRANKED: "언랭크",
  BRONZE: "브론즈",
  SILVER: "실버",
  GOLD: "골드",
  PLATINUM: "플래티넘",
  DIAMOND: "다이아",
  MASTER: "마스터",
}

const TIER_IMAGE: Record<string, string> = {
  UNRANKED: "/tier-icons/tier-bronze.svg",
  BRONZE: "/tier-icons/tier-bronze.svg",
  SILVER: "/tier-icons/tier-silver.svg",
  GOLD: "/tier-icons/tier-gold.svg",
  PLATINUM: "/tier-icons/tier-platinum.svg",
  DIAMOND: "/tier-icons/tier-diamond.svg",
  MASTER: "/tier-icons/tier-master.svg",
}

const TIER_ORDER = [
  "UNRANKED",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "DIAMOND",
  "MASTER",
] as const
const TIER_THRESHOLDS: Record<(typeof TIER_ORDER)[number], number> = {
  UNRANKED: 0,
  BRONZE: 1,
  SILVER: 100,
  GOLD: 200,
  PLATINUM: 300,
  DIAMOND: 400,
  MASTER: 500,
}

export function tierIcon(tier: string) {
  return (
    <Image
      src={TIER_IMAGE[tier]}
      alt={TIER_IMAGE[tier]}
      width={40}
      height={40}
    />
  )
}

export function tierLabel(tier: string) {
  return TIER_LABELS[tier] ?? tier
}

export function tierProgress(score: number) {
  const currentIndex = TIER_ORDER.reduce(
    (acc, tier, i) => (score >= TIER_THRESHOLDS[tier] ? i : acc),
    0,
  )
  const nextTier = TIER_ORDER[currentIndex + 1]
  if (!nextTier) return { nextTier: undefined, nextAt: undefined, percent: 100 }

  const currentAt = TIER_THRESHOLDS[TIER_ORDER[currentIndex]]
  const nextAt = TIER_THRESHOLDS[nextTier]
  const percent = Math.min(
    100,
    ((score - currentAt) / (nextAt - currentAt)) * 100,
  )
  return { nextTier, nextAt, percent }
}
