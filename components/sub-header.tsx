"use client"

import { useRouter } from "next/navigation"

import { ChevronLeft } from "lucide-react"

/**
 * 모바일 전용 하위 페이지 헤더 — 뒤로 + 가운데 제목. 뒤로는 history가 있으면 router.back(),
 * 없으면(링크로 바로 들어온 경우) fallback으로 보낸다. 이슈 상세의 goBack과 같은 규칙.
 */
export function SubHeader({
  title,
  fallback = "/issue",
}: {
  title: string
  fallback?: string
}) {
  const router = useRouter()

  function goBack() {
    if (window.history.length > 1) router.back()
    else router.push(fallback)
  }

  return (
    <header className="sticky top-0 z-20 grid h-[52px] grid-cols-[48px_1fr_48px] items-center bg-bg px-1 lg:hidden">
      <button
        type="button"
        onClick={goBack}
        className="grid size-11 place-items-center"
        aria-label="뒤로"
      >
        <ChevronLeft className="size-6" />
      </button>
      <h1 className="truncate text-center text-[17px] font-bold">{title}</h1>
    </header>
  )
}
