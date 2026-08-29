type IconProps = {
  /** Material Symbols Rounded glyph name, e.g. "rainy" */
  name: string
  filled?: boolean
  size?: number
  className?: string
  style?: React.CSSProperties
}

/**
 * Material Symbols Rounded. app/layout.tsx <head> 에 아래 링크가 필요합니다.
 *
 * <link
 *   rel="stylesheet"
 *   href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,500,0,0"
 * />
 */
export function Icon({ name, filled = true, size = 16, className, style }: IconProps) {
  return (
    <span
      aria-hidden
      className={className}
      style={{
        fontFamily: "'Material Symbols Rounded'",
        fontSize: size,
        lineHeight: 1,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}`,
        ...style,
      }}
    >
      {name}
    </span>
  )
}
