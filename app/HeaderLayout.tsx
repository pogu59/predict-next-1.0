"use client"

import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { clearSessionToken } from "@/lib/auth"
import { useMe } from "@/lib/queries/auth"
import { queryKeys } from "@/lib/queries/keys"
import { tierLabel } from "@/lib/tier"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

type HeaderLayoutProps = {
  children: React.ReactNode
}

const NAV_LIST = [
  { label: "이슈", value: "issue" },
  { label: "커뮤니티", value: "board" },
  { label: "미니게임", value: "game" },
  { label: "마이페이지", value: "my" },
]

const ADMIN_NAV_ITEM = { label: "관리자", value: "admin" }

export function HeaderLayout({ children }: HeaderLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const { data: me } = useMe()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  function handleLogout() {
    clearSessionToken()
    queryClient.removeQueries({ queryKey: queryKeys.me })
    setShowLogoutConfirm(false)
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="flex min-h-[66px] flex-none flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-headerBg px-4 py-2.5 md:h-[66px] md:flex-nowrap md:gap-x-[26px] md:px-6 md:py-0">
        <button className="text-h1 text-ink" onClick={() => router.push("/")}>
          Predict
        </button>

        <nav className="flex items-center gap-4 md:gap-6">
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
            <span className="hidden text-label text-ink-muted sm:inline">
              {me.nickname}
            </span>
            <span className="text-title3 tabular-nums">
              {me.credibilityScore.toLocaleString()}
            </span>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
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

      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="로그아웃 하시겠어요?"
        description="다시 로그인해야 투표 기록과 신용도 점수를 확인할 수 있어요."
        confirmLabel="로그아웃"
        variant="destructive"
        onConfirm={handleLogout}
      />
    </div>
  )
}
