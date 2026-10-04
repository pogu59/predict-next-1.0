import Image from "next/image"

/**
 * 티어 라벨/구간표. 서버는 Tier enum을 이름 그대로("GOLD" 등) 내려주므로 한글 라벨은 프론트에서 매핑한다.
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

const TIER_ORDER = ["UNRANKED", "BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "MASTER"] as const

/** 신규 가입 500 = 골드 시작. 백엔드 TierPolicy와 같은 구간이다. */
export const TIER_THRESHOLDS: Record<(typeof TIER_ORDER)[number], number> = {
  UNRANKED: 0,
  BRONZE: 1,
  SILVER: 300,
  GOLD: 500,
  PLATINUM: 800,
  DIAMOND: 1200,
  MASTER: 1800,
}

export function TierIcon({ tier, size = 20 }: { tier: string; size?: number }) {
  // 서버가 프론트에 없는 티어 이름을 보내면 src가 undefined가 되어 next/image가 throw한다.
  const src = TIER_IMAGE[tier]
  if (!src) return null
  return (
    <Image
      src={src}
      alt={tierLabel(tier)}
      width={size}
      height={size}
      className="flex-none"
      style={{ width: size, height: size }}
    />
  )
}

/** 티어 아이콘 경로(canvas 공유 카드 등 next/image 밖에서 쓸 때). */
export function tierImage(tier: string) {
  return TIER_IMAGE[tier] ?? TIER_IMAGE.BRONZE
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
  if (!nextTier) return { nextTier: undefined, remaining: 0, percent: 100 }

  const currentAt = TIER_THRESHOLDS[TIER_ORDER[currentIndex]]
  const nextAt = TIER_THRESHOLDS[nextTier]
  const percent = Math.max(0, Math.min(100, Math.round(((score - currentAt) / (nextAt - currentAt)) * 100)))
  return { nextTier, remaining: Math.max(0, nextAt - score), percent }
}
