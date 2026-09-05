"use client"

import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { clearSessionToken } from "@/lib/auth"
import { useMe } from "@/lib/queries/auth"
import { queryKeys } from "@/lib/queries/keys"
import { tierChipStyle, tierIcon, tierLabel } from "@/lib/tier"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Icon } from "@/components/icon"

type HeaderLayoutProps = {
  children: React.ReactNode
}

const NAV_LIST = [
  { label: "이슈", value: "issue" },
  { label: "커뮤니티", value: "board" },
  { label: "마이페이지", value: "my" },
]

const ADMIN_NAV_ITEM = { label: "관리자", value: "admin" }

export function HeaderLayout({ children }: HeaderLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const { data: me } = useMe()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [search, setSearch] = useState("")

  function handleLogout() {
    clearSessionToken()
    queryClient.removeQueries({ queryKey: queryKeys.me })
    setShowLogoutConfirm(false)
    router.push("/login")
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = search.trim()
    router.push(q ? `/issue?q=${encodeURIComponent(q)}` : "/issue")
  }

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="flex min-h-[64px] flex-none flex-wrap items-center gap-x-4 gap-y-2 bg-headerBg px-4 py-2.5 md:h-[64px] md:flex-nowrap md:gap-x-[22px] md:px-7 md:py-0">
        <button
          className="flex flex-none items-center gap-2.5"
          onClick={() => router.push("/")}
        >
          <svg width="26" height="26" viewBox="0 0 48 48" className="flex-none">
            <rect x="6" y="6" width="36" height="36" rx="9" fill="rgba(255,255,255,.12)" />
            <path d="M24 14 34 24 24 34 14 24z" fill="var(--accent)" />
          </svg>
          <span className="text-[21px] font-extrabold tracking-[-0.04em] text-white">
            Predict
          </span>
        </button>

        <nav className="flex flex-none items-center gap-1">
          {(me?.role === "ADMIN" ? [...NAV_LIST, ADMIN_NAV_ITEM] : NAV_LIST).map(
            (menu) => {
              const active = pathname?.startsWith(`/${menu.value}`)
              return (
                <button
                  key={menu.value}
                  type="button"
                  onClick={() => router.push(`/${menu.value}`)}
                  className={
                    active
                      ? "rounded-lg bg-white px-[13px] py-2 text-[14.5px] font-bold whitespace-nowrap text-[#16151A]"
                      : "rounded-lg px-[13px] py-2 text-[14.5px] font-semibold whitespace-nowrap text-white/72 transition-colors hover:text-white"
                  }
                >
                  {menu.label}
                </button>
              )
            },
          )}
        </nav>

        <form
          onSubmit={handleSearch}
          className="order-last flex w-full min-w-0 items-center gap-2.5 rounded-[10px] border border-white/16 bg-white/9 px-[13px] py-2.5 md:order-none md:w-auto md:max-w-[360px] md:flex-1"
        >
          <Icon name="search" filled={false} size={19} className="flex-none text-white/60" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이슈 검색"
            className="w-full min-w-0 bg-transparent text-[13.5px] font-medium text-white placeholder:text-white/60 focus:outline-none"
          />
        </form>

        <div className="hidden flex-auto md:block" />

        <div className="flex flex-none items-center gap-2.5">
          {me ? (
            <>
              <div
                className="flex items-center gap-2 rounded-full border py-[5px] pr-3 pl-1.5"
                style={tierChipStyle(me.tier)}
              >
                <span className="flex flex-none items-center justify-center">
                  {tierIcon(me.tier, 17)}
                </span>
                <span className="text-[11.5px] font-extrabold">
                  {tierLabel(me.tier)}
                </span>
                <span className="text-[13px] font-bold text-[#16151A]">
                  {me.nickname}
                </span>
                <span className="text-[13px] font-extrabold tabular-nums text-[#16151A]">
                  {me.credibilityScore.toLocaleString()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="rounded-[9px] border border-white/20 px-[13px] py-2 text-[13px] font-semibold whitespace-nowrap text-white/78 transition-colors hover:bg-white/10"
              >
                로그아웃
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="rounded-[9px] border border-white/20 px-[13px] py-2 text-[13px] font-semibold whitespace-nowrap text-white/78 transition-colors hover:bg-white/10"
            >
              로그인
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-[1440px]">{children}</div>

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
