"use client"

import { cn } from "@/lib/utils"

type CommentInputProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder: string
  disabled?: boolean
  className?: string
}

/**
 * 회색 둥근 입력 + "등록" 버튼. Enter로 등록하되 한글 IME 조합 중에는 무시한다.
 * 빈 값이면 등록 버튼을 비활성 색(#E4E4E2)으로 둔다.
 */
export function CommentInput({ value, onChange, onSubmit, placeholder, disabled, className }: CommentInputProps) {
  const ready = value.trim().length > 0
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-[14px] bg-bg py-1 pr-1 pl-3.5 lg:py-[5px] lg:pr-[5px] lg:pl-4",
        className,
      )}
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) onSubmit()
        }}
        placeholder={placeholder}
        className="h-10 min-w-0 flex-1 bg-transparent text-[15px] outline-none lg:h-[42px]"
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled}
        className={cn(
          "h-[38px] rounded-[11px] px-3.5 text-sm font-bold lg:h-10 lg:px-[18px]",
          ready ? "bg-brand text-white" : "bg-disabled-bg text-muted",
        )}
      >
        등록
      </button>
    </div>
  )
}
