import { cn } from "@/lib/utils"

type Surface = "card" | "bg"

const baseClass = "rounded-md border border-line text-ink text-sm font-bold px-3 py-2 placeholder:text-ink-faint"
const surfaceClass: Record<Surface, string> = {
  card: "bg-card",
  bg: "bg-bg",
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { surface?: Surface }

/** 관리자 페이지 필터/폼에서 반복되는 select 스타일을 한곳에 모은다. */
export function Select({ surface = "card", className, ...props }: SelectProps) {
  return <select className={cn(baseClass, surfaceClass[surface], className)} {...props} />
}

type TextInputProps = React.InputHTMLAttributes<HTMLInputElement> & { surface?: Surface }

export function TextInput({ surface = "card", className, ...props }: TextInputProps) {
  return <input className={cn(baseClass, surfaceClass[surface], className)} {...props} />
}
