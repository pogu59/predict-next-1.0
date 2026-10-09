"use client"

import { CircleCheck } from "lucide-react"
import { usePathname } from "next/navigation"
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"

type ToastContextValue = (message: string) => void

const ToastContext = createContext<ToastContextValue>(() => {})

/** 하단 중앙 토스트. showToast("…")만 부르면 약 2초 뒤 사라진다. */
export function useToast() {
  return useContext(ToastContext)
}

/** 모바일에서 하단 고정 요소(탭바·CTA·댓글 입력바) 위로 띄울 높이. */
function mobileBottom(pathname: string) {
  if (["/", "/issue", "/mission", "/report", "/board", "/my"].includes(pathname) || /^\/issue\/\d+$/.test(pathname)) return "110px"
  // 미션 문항 화면은 하단 고정 버튼(안내 문구 + 이전/다음)이 더 높다.
  if (/^\/mission\/\d+$/.test(pathname)) return "150px"
  if (/^\/board\/\d+$/.test(pathname)) return "96px"
  return "40px"
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ""
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const show = useCallback((message: string) => {
    clearTimeout(timer.current)
    setToast({ id: Date.now(), message })
    timer.current = setTimeout(() => setToast(null), 1900)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  const isAdmin = pathname.startsWith("/admin")

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div
          key={toast.id}
          role="status"
          style={{ "--toast-b": mobileBottom(pathname) } as React.CSSProperties}
          className={`fixed bottom-[var(--toast-b)] left-1/2 z-[60] flex -translate-x-1/2 animate-toast-in items-center gap-1.5 rounded-[14px] bg-ink px-[18px] py-3 text-sm font-semibold whitespace-nowrap text-white lg:gap-2 lg:px-5 lg:py-[13px] ${isAdmin ? "lg:bottom-8" : "lg:bottom-9"}`}
        >
          <CircleCheck className="size-[18px] text-brand-on-dark lg:size-[17px]" />
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  )
}
