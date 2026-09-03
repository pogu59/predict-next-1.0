type BadgeProps = {
  children: React.ReactNode
  tone?: "neutral" | "accent" | "warning"
}

/**
 * 관리자 페이지 전반에서 쓰는 작은 pill 배지(상태/권한/활동성 표시).
 * neutral = 테두리만, accent = 강조색 배경(관리자 등), warning = 경고색 배경(활동성 강등 등).
 */
export function Badge({ children, tone = "neutral" }: BadgeProps) {
  const toneClass =
    tone === "accent"
      ? "bg-void text-accent-ink"
      : tone === "warning"
        ? "border-line-strong text-ink-subtle border"
        : "border-line text-ink border"

  return (
    <span className={`inline-block rounded-md px-2 py-1 text-caption font-extrabold ${toneClass}`}>
      {children}
    </span>
  )
}
