"use client"

import { Check, ChevronLeft, ChevronRight, CircleCheck } from "lucide-react"

import { cn } from "@/lib/utils"

type AuthScreenProps = {
  onBack: () => void
  /** "1 / 3" 같은 단계 표시. 없으면 진행바도 숨긴다. */
  step?: string
  /** 진행바 채움(%) */
  progress?: number
  title: React.ReactNode
  /** 단계 제목 위에 붙는 뱃지(소셜 계정 연결됨 등) */
  badge?: React.ReactNode
  children: React.ReactNode
  cta: { label: string; enabled: boolean; loading?: boolean; onClick: () => void }
  /** 모바일에서는 CTA 위(본문 아래), PC에서는 CTA 아래에 놓이는 보조 링크 */
  links?: React.ReactNode
  /** PC 카드 안 요소 간격(px) */
  pcGap?: number
  titleClassName?: string
}

/**
 * 로그인·가입 단계 화면. 모바일은 흰 전체 화면 + 하단 CTA, PC는 가운데 440px 카드(radius 28, padding 36).
 */
export function AuthScreen({
  onBack,
  step,
  progress,
  title,
  badge,
  children,
  cta,
  links,
  pcGap = 22,
  titleClassName,
}: AuthScreenProps) {
  return (
    <div
      className="flex min-h-dvh flex-col bg-surface lg:mx-auto lg:mt-10 lg:min-h-0 lg:max-w-[440px] lg:gap-[var(--pc-gap)] lg:rounded-[28px] lg:p-9 lg:shadow-card"
      style={{ "--pc-gap": `${pcGap}px` } as React.CSSProperties}
    >
      <div className="flex h-[52px] items-center justify-between px-3 lg:h-auto lg:px-0">
        <button type="button" onClick={onBack} className="p-2 lg:hidden" aria-label="뒤로">
          <ChevronLeft className="size-6" />
        </button>
        <button
          type="button"
          onClick={onBack}
          className="hidden items-center gap-1 text-sm font-semibold text-sub lg:flex"
        >
          <ChevronLeft className="size-[18px]" />
          이전
        </button>
        {step && <span className="pr-3 text-[13px] font-semibold text-muted lg:pr-0">{step}</span>}
      </div>

      {step && (
        <div className="mx-6 h-[3px] bg-line-3 lg:mx-0 lg:h-1 lg:rounded-[2px]">
          <div className="h-full rounded-[2px] bg-brand" style={{ width: `${progress ?? 0}%` }} />
        </div>
      )}

      <div
        className={cn(
          "flex flex-col gap-[26px] px-6 lg:gap-[var(--pc-gap)] lg:p-0",
          step ? "pt-6" : "pt-2",
        )}
      >
        {badge || title ? (
          <div className="flex flex-col gap-2 lg:gap-[var(--pc-gap)]">
            {badge}
            <h1 className={cn("text-[26px] leading-[1.35] font-extrabold tracking-[-0.035em]", titleClassName)}>
              {title}
            </h1>
          </div>
        ) : null}
        {children}
        {links && <div className="lg:hidden">{links}</div>}
      </div>

      <div className="flex-1 lg:hidden" />

      <div className="px-6 pt-4 pb-7 lg:p-0">
        <CtaButton {...cta} />
      </div>
      {links && <div className="hidden lg:block">{links}</div>}
    </div>
  )
}

export function CtaButton({
  label,
  enabled,
  loading,
  onClick,
  className,
}: {
  label: string
  enabled: boolean
  loading?: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn(
        "h-14 w-full rounded-2xl text-base font-bold transition-colors",
        enabled ? "bg-brand text-white" : "bg-disabled-bg text-muted",
        className,
      )}
    >
      {label}
    </button>
  )
}

type FieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: "text" | "password" | "email"
  /** 테두리를 danger로 */
  invalid?: boolean
  message?: string
  messageTone?: "danger" | "success"
  /** 메시지 줄을 항상 확보(가입 단계) */
  reserveMessage?: boolean
  maxLength?: number
  suffix?: React.ReactNode
}

export function AuthField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  invalid,
  message,
  messageTone = "danger",
  reserveMessage,
  maxLength,
  suffix,
}: FieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] font-semibold text-sub">{label}</span>
      <div className="relative">
        <input
          type={type}
          value={value}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "h-[52px] w-full rounded-[14px] border-[1.5px] bg-surface px-4 text-base outline-none",
            invalid ? "border-danger" : "border-line-2 focus:border-brand",
            suffix && "pr-[60px]",
          )}
        />
        {suffix && (
          <span className="absolute top-[17px] right-4 text-[13px] text-faint tabular-nums">{suffix}</span>
        )}
      </div>
      {(reserveMessage || message) && (
        <span
          className={cn(
            "min-h-3.5 text-xs",
            messageTone === "success" ? "text-success" : "text-danger",
          )}
        >
          {message}
        </span>
      )}
    </label>
  )
}

export function TermsAllRow({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-3 rounded-2xl bg-bg px-4 py-[18px] text-left"
    >
      <CircleCheck className={cn("size-[26px] lg:size-6", on ? "text-brand" : "text-[#D6D6D3]")} />
      <span className="text-base font-bold">전체 동의</span>
    </button>
  )
}

export function TermsRow({
  label,
  required,
  on,
  onToggle,
}: {
  label: string
  required: boolean
  on: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-3 px-4 py-3 text-left lg:py-[11px]"
    >
      <Check className={cn("size-[22px] lg:size-5", on ? "text-brand" : "text-[#D6D6D3]")} />
      <span className="flex-1 text-[15px] text-ink-2">
        {label}{" "}
        <span className={cn("text-[13px]", required ? "text-brand" : "text-faint")}>
          {required ? "(필수)" : "(선택)"}
        </span>
      </span>
      <ChevronRight className="size-5 text-disabled-ink lg:size-[18px]" />
    </button>
  )
}
