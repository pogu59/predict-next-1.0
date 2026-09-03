"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import {
  clearSessionToken,
  fetchMe,
  getSessionToken,
  type Me,
} from "@/lib/auth"
import { tierLabel } from "@/lib/tier"

type HeaderLayoutProps = {
  children: React.ReactNode
}

const NAV_LIST = [
  { label: "이슈", value: "issue" },
  { label: "마이페이지", value: "my" },
]

const ADMIN_NAV_ITEM = { label: "관리자", value: "admin" }

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
      <header className="flex h-[66px] flex-none items-center gap-[26px] border-b border-line bg-headerBg px-6">
        <button className="text-h1 text-ink" onClick={() => router.push("/")}>
          Predict
        </button>

        <nav className="flex items-center gap-6">
          {(me?.role === "ADMIN"
            ? [...NAV_LIST, ADMIN_NAV_ITEM]
            : NAV_LIST
          ).map((menu) => {
            const active = pathname?.startsWith(`/${menu.value}`)
            return (
              <button
                key={menu.value}
                type="button"
                onClick={() => router.push(`/${menu.value}`)}
                className={
                  active
                    ? "text-label text-ink"
                    : "text-label text-ink-subtle transition-colors hover:text-ink"
                }
              >
                {menu.label}
              </button>
            )
          })}
        </nav>

        <div className="flex-auto" />

        {me ? (
          <div className="flex items-center gap-2 rounded-full border border-line bg-card py-[7px] pr-[15px] pl-2">
            <span className="rounded-md bg-void px-1.5 py-1 text-caption leading-none text-bg">
              {tierLabel(me.tier)}
            </span>
            <span className="text-label text-ink-muted">{me.nickname}</span>
            <span className="text-title3 tabular-nums">
              {me.credibilityScore.toLocaleString()}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-caption text-ink-faint hover:text-ink"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="rounded-full border border-line bg-card px-4 py-2 text-label text-ink-muted hover:text-ink"
          >
            로그인
          </button>
        )}
      </header>

      <div className="mx-auto max-w-7xl">{children}</div>
    </div>
  )
}
