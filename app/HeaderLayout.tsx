"use client"

import { ChartNoAxesColumn, House, MessagesSquare, UserRound } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { useMe } from "@/lib/queries/auth"
import { TierIcon } from "@/lib/tier"
import { cn } from "@/lib/utils"
import { Avatar, Logo } from "@/components/ui/brand"

const AUTH_PREFIXES = ["/login", "/signup", "/auth"]

const PC_NAV = [
  { href: "/issue", label: "예측", Icon: ChartNoAxesColumn },
  { href: "/board", label: "커뮤니티", Icon: MessagesSquare },
]

const MOBILE_TABS = [
  { href: "/", label: "홈", Icon: House },
  { href: "/board", label: "커뮤니티", Icon: MessagesSquare },
  { href: "/my", label: "마이", Icon: UserRound },
]

/**
 * 사용자 앱 셸. PC(≥1024)는 64px 스티키 헤더 + 1200px 컨테이너, 모바일은 각 페이지가 자체 헤더를 그리고
 * 홈·커뮤니티·마이 목록에서만 하단 탭바를 띄운다. /admin은 별도 레이아웃이라 셸을 쓰지 않는다.
 */
export function HeaderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/"

  if (pathname.startsWith("/admin")) return <>{children}</>

  const isAuth = AUTH_PREFIXES.some((p) => pathname.startsWith(p))
  // 예측 목록(/issue)은 홈에서 들어가는 화면이라 탭바를 그대로 두고 "홈"을 활성으로 표시한다.
  const showTabs = pathname === "/issue" || MOBILE_TABS.some((t) => t.href === pathname)

  return (
    <div className="min-h-dvh">
      {isAuth ? <AuthHeader /> : <AppHeader pathname={pathname} />}
      <div className="lg:mx-auto lg:max-w-[1200px] lg:px-8 lg:pt-7 lg:pb-20">{children}</div>
      {showTabs && <TabBar pathname={pathname} />}
    </div>
  )
}

function GuestActions() {
  return (
    <div className="flex gap-2">
      <Link href="/login/email" className="rounded-xl px-4 py-[9px] text-sm font-bold text-ink hover:bg-line">
        로그인
      </Link>
      <Link href="/signup/email" className="rounded-xl bg-ink px-4 py-[9px] text-sm font-bold text-white">
        회원가입
      </Link>
    </div>
  )
}

function AuthHeader() {
  return (
    <header className="mx-auto hidden h-16 max-w-[1200px] items-center justify-between px-8 lg:flex">
      <Link href="/login">
        <Logo />
      </Link>
      <GuestActions />
    </header>
  )
}

function AppHeader({ pathname }: { pathname: string }) {
  const { data: me, isLoading } = useMe()

  return (
    <header className="sticky top-0 z-30 hidden border-b border-line bg-white/88 backdrop-blur-[14px] lg:block">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-8 px-8">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="flex gap-1">
          {PC_NAV.map(({ href, label, Icon }) => {
            const active = pathname.startsWith(href) || (href === "/issue" && pathname === "/")
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-[7px] rounded-xl px-3.5 py-[9px] text-[15px] font-bold hover:bg-track",
                  active ? "bg-line-3 text-ink" : "text-[#8A8A90]",
                )}
              >
                <Icon className="size-[18px]" />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="flex-1" />
        {me ? (
          <Link
            href="/my"
            className="flex items-center gap-2.5 rounded-full bg-surface py-[5px] pr-1.5 pl-3 shadow-[0_0_0_1px_#EDEDEB]"
          >
            <TierIcon tier={me.tier} size={20} />
            <span className="text-sm font-bold tabular-nums">{me.credibilityScore.toLocaleString()}</span>
            <Avatar nickname={me.nickname} className="size-8 text-xs" />
          </Link>
        ) : (
          !isLoading && <GuestActions />
        )}
      </div>
    </header>
  )
}

function TabBar({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-[84px] justify-around border-t border-line bg-white/92 pt-2.5 backdrop-blur-[14px] lg:hidden">
      {MOBILE_TABS.map(({ href, label, Icon }) => {
        const active = pathname === href || (href === "/" && pathname === "/issue")
        return (
          <Link
            key={href}
            href={href}
            className={cn("flex w-20 flex-col items-center gap-[3px]", active ? "text-ink" : "text-faint")}
          >
            <Icon className="size-[25px]" />
            <span className="text-[11px] font-bold">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
