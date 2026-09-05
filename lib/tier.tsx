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

/** design_handoff_predict_home_bright 티어 팔레트(브론즈~마스터). 헤더 티어 pill의 배경/테두리는 여기서 color-mix로 옅게 파생시킨다. */
const TIER_COLORS: Record<string, string> = {
  UNRANKED: "#B5B9C1",
  BRONZE: "#D9A06A",
  SILVER: "#C9D3DE",
  GOLD: "#F2C14E",
  PLATINUM: "#7FD8C8",
  DIAMOND: "#6FC5FF",
  MASTER: "#FF5436",
}

export function tierChipStyle(tier: string): React.CSSProperties {
  const c = TIER_COLORS[tier] ?? TIER_COLORS.BRONZE
  return {
    background: `color-mix(in oklab, ${c} 14%, white)`,
    borderColor: `color-mix(in oklab, ${c} 38%, white)`,
    color: `color-mix(in oklab, ${c} 65%, black)`,
  }
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

export function tierIcon(tier: string, size = 40) {
  return (
    <Image
      src={TIER_IMAGE[tier]}
      alt={tierLabel(tier)}
      width={size}
      height={size}
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
