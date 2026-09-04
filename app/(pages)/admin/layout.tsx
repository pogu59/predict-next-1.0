"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

import { useMe } from "@/lib/queries/auth"

const SUB_NAV = [
  { label: "주제 관리", href: "/admin" },
  { label: "유저 관리", href: "/admin/users" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: me, isLoading } = useMe()

  useEffect(() => {
    if (isLoading) return
    if (!me) router.replace("/login")
    else if (me.role !== "ADMIN") router.replace("/issue")
  }, [isLoading, me, router])

  if (isLoading || !me || me.role !== "ADMIN") {
    return (
      <div className="flex flex-col gap-3 px-6 pt-8 pb-11">
        <div className="text-ink-subtle text-label">확인 중...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[22px] px-4 pt-8 pb-11 sm:px-6">
      <div className="flex flex-wrap items-center gap-2.5">
        <h1 className="text-h1">관리자 페이지</h1>
        <span className="text-ink-faint text-caption">{me.nickname}</span>
      </div>

      <nav className="flex items-center gap-2">
        {SUB_NAV.map((item) => {
          const active =
            item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href)
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => router.push(item.href)}
              className={
                active
                  ? "rounded-full bg-ink px-4 py-2 text-label text-bg"
                  : "border-line text-ink-muted hover:text-ink rounded-full border bg-card px-4 py-2 text-label transition-colors"
              }
            >
              {item.label}
            </button>
          )
        })}
      </nav>

      {children}
    </div>
  )
}
