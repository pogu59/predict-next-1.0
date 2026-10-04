import { cn } from "@/lib/utils"

/** 로고 "predict." — 마침표만 brand 색. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("text-2xl font-extrabold tracking-[-0.04em]", className)}>
      predict<span className="text-brand">.</span>
    </span>
  )
}

const AVATAR_BG = ["#EEECFF", "#FFEFE3", "#E3F5EC", "#FFF4DE", "#E8F1FF"]

type AvatarProps = {
  nickname: string
  /** "brand"(연보라 배경·brand 글자) | "neutral"(#F3F3F1·#6B6B70) | "colorful"(닉네임별 파스텔) */
  tone?: "brand" | "neutral" | "colorful"
  /** 크기·글자 크기(예: "size-[34px] text-[13px]") */
  className: string
}

/** 프로필 이미지 API가 없어 닉네임 첫 글자로 그린다. */
export function Avatar({ nickname, tone = "brand", className }: AvatarProps) {
  const background =
    tone === "neutral"
      ? "#F3F3F1"
      : tone === "colorful"
        ? AVATAR_BG[nickname.length % AVATAR_BG.length]
        : "#EEECFF"
  return (
    <span
      className={cn(
        "grid flex-none place-items-center rounded-full font-bold",
        tone === "neutral" ? "text-sub" : "text-brand",
        className,
      )}
      style={{ background }}
    >
      {nickname.slice(0, 1)}
    </span>
  )
}

export function Chip({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("rounded-[7px] px-2 py-[5px] text-xs font-bold tabular-nums", className)}>
      {children}
    </span>
  )
}
