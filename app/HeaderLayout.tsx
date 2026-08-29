"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

import { clearSessionToken, fetchMe, getSessionToken, type Me } from "@/lib/auth"
import { tierLabel } from "@/lib/tier"

type HeaderLayoutProps = {
  children: React.ReactNode
}

const NAV_LIST = [
  { label: "이슈", value: "issue" },
  { label: "마이페이지", value: "my" },
]

export function HeaderLayout({ children }: HeaderLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [me, setMe] = useState<Me | null>(null)

  useEffect(() => {
    if (!getSessionToken()) return
    fetchMe().then(setMe)
  }, [pathname])

  function handleLogout() {
    clearSessionToken()
    setMe(null)
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="flex items-center gap-10 border-b border-line bg-headerBg px-6 py-4">
        <div className="text-2xl font-extrabold tracking-[-0.04em] text-ink">Predict</div>

        <nav className="flex items-center gap-2">
          {NAV_LIST.map((menu) => {
            const active = pathname?.startsWith(`/${menu.value}`)
            return (
              <button
                key={menu.value}
                type="button"
                onClick={() => router.push(`/${menu.value}`)}
                className={
                  active
                    ? "rounded-md bg-control px-4 py-2 text-sm font-bold text-ink"
                    : "rounded-md px-4 py-2 text-sm font-bold text-ink-subtle transition-colors hover:text-ink"
                }
              >
                {menu.label}
              </button>
            )
          })}
        </nav>

        <div className="flex-auto" />

        {me ? (
          <div className="flex items-center gap-2.5 rounded-full border border-line bg-card py-1.5 pl-2 pr-4">
            <span className="rounded-md bg-void px-1.5 py-1 text-[10.5px] font-extrabold leading-none text-bg">
              {tierLabel(me.tier)}
            </span>
            <span className="text-[13px] font-bold text-ink-muted">{me.nickname}</span>
            <span className="text-[15px] font-extrabold leading-none tracking-[-0.02em] tabular-nums">
              {me.credibilityScore.toLocaleString()}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-[11.5px] font-bold text-ink-faint hover:text-ink"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="rounded-full border border-line bg-card px-4 py-2 text-[13px] font-bold text-ink-muted hover:text-ink"
          >
            로그인
          </button>
        )}
      </header>

      <div className="mx-auto max-w-7xl">{children}</div>
    </div>
  )
}
