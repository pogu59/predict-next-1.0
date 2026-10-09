"use client"

import {
  Gift,
  LayoutDashboard,
  ListChecks,
  ListTodo,
  MessagesSquare,
  Plus,
  Radio,
  ShieldCheck,
  Siren,
  Smartphone,
  Users,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

import { useAdminExchanges, useAdminReports, useAllAdminIssues } from "@/lib/queries/admin"
import { useMe } from "@/lib/queries/auth"
import { cn } from "@/lib/utils"
import { AdminUIProvider, useAdminUI } from "@/components/admin/admin-ui"
import { Logo } from "@/components/ui/brand"

const PAGES = [
  { href: "/admin", label: "대시보드", Icon: LayoutDashboard, sub: "오늘 처리할 일을 한눈에 확인하세요" },
  { href: "/admin/issues", label: "이슈 관리", Icon: ListChecks, sub: "예측 이슈를 만들고, 마감·결과를 관리해요" },
  { href: "/admin/live", label: "라이브 출제", Icon: Radio, sub: "경기 중 짧은 예측을 빠르게 열고 판정해요" },
  { href: "/admin/users", label: "회원 관리", Icon: Users, sub: "가입 회원과 권한, 활동 정지를 관리해요" },
  { href: "/admin/community", label: "커뮤니티 관리", Icon: MessagesSquare, sub: "게시글과 댓글을 숨기거나 삭제해요" },
  { href: "/admin/reports", label: "신고 처리", Icon: Siren, sub: "사용자 신고를 검토하고 처리해요" },
  // 미션·리워드 화면은 각자 만들기 버튼을 가져서 상단 "새 이슈 만들기"를 숨긴다.
  {
    href: "/admin/missions",
    label: "미션 관리",
    Icon: ListTodo,
    sub: "출석·밸런스 게임·설문 미션을 만들고 공개·마감해요",
    createIssue: false,
  },
  {
    href: "/admin/exchanges",
    label: "교환 승인",
    Icon: Gift,
    sub: "참여자에게 1~2일 안에 보내기로 했어요. 24시간이 넘은 신청은 빨간색으로 표시돼요",
    createIssue: false,
  },
]

/** 관리자 영역 — 사용자 앱과 분리된 PC 전용 레이아웃(좌측 236px 사이드바 + 메인). ADMIN만 접근. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { data: me, isLoading } = useMe()

  useEffect(() => {
    if (isLoading) return
    if (!me) router.replace("/login")
    else if (me.role !== "ADMIN") router.replace("/")
  }, [isLoading, me, router])

  if (isLoading || !me || me.role !== "ADMIN") {
    return <div className="py-20 text-center text-sm text-faint">확인 중...</div>
  }

  return (
    <>
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center lg:hidden">
        <Logo />
        <span className="text-[15px] font-semibold text-sub">관리자 페이지는 PC에서 이용해 주세요</span>
        <Link href="/" className="text-sm font-bold text-brand">
          사용자 앱 보기
        </Link>
      </div>
      <div className="hidden min-h-dvh lg:flex">
        <AdminUIProvider>
          <Sidebar nickname={me.nickname} />
          <main className="min-w-0 flex-1 px-9 pt-7 pb-[60px]">
            <div className="mx-auto flex max-w-[1280px] flex-col gap-[22px]">
              <PageHeader />
              {children}
            </div>
          </main>
        </AdminUIProvider>
      </div>
    </>
  )
}

function currentPage(pathname: string) {
  return [...PAGES].reverse().find((p) => (p.href === "/admin" ? pathname === "/admin" : pathname.startsWith(p.href))) ?? PAGES[0]
}

function PageHeader() {
  const pathname = usePathname() ?? "/admin"
  const { openCreate } = useAdminUI()
  const page = currentPage(pathname)
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex min-w-60 flex-1 flex-col gap-1.5">
        <h1 className="text-[28px] font-extrabold tracking-[-0.04em]">{page.label}</h1>
        <span className="text-sm text-sub">{page.sub}</span>
      </div>
      {page.createIssue !== false && (
        <button
          type="button"
          onClick={openCreate}
          className="flex h-[46px] items-center gap-[7px] rounded-[14px] bg-brand pr-5 pl-4 text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(91,75,255,.25)] hover:bg-brand-hover"
        >
          <Plus className="size-[19px]" />
          새 이슈 만들기
        </button>
      )}
    </div>
  )
}

function Sidebar({ nickname }: { nickname: string }) {
  const pathname = usePathname() ?? "/admin"
  const { data: issues } = useAllAdminIssues()
  const { data: reports = [] } = useAdminReports("PENDING")
  const { data: exchanges = [] } = useAdminExchanges("REQUESTED")
  const active = currentPage(pathname)
  const badges: Record<string, number> = {
    "/admin/issues": (issues?.items ?? []).filter((i) => i.status === "PENDING_RESULT").length,
    "/admin/reports": reports.length,
    "/admin/exchanges": exchanges.length,
  }

  return (
    <aside className="sticky top-0 flex h-dvh w-[236px] flex-none flex-col border-r border-line bg-surface px-3.5 py-[22px]">
      <div className="flex items-center gap-2 px-2.5 pb-[26px]">
        <Logo className="text-[22px]" />
        <span className="rounded-md bg-brand-soft px-[7px] py-[3px] text-[11px] font-bold text-brand">ADMIN</span>
      </div>
      <nav className="flex flex-col gap-0.5">
        {PAGES.map(({ href, label, Icon }) => {
          const on = active.href === href
          const badge = badges[href] ?? 0
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-[11px] rounded-xl px-3 py-[11px] text-sm hover:bg-track",
                on ? "bg-brand-tint font-bold text-brand hover:bg-brand-tint" : "font-semibold text-[#4A4A50]",
              )}
            >
              <Icon className="size-[19px]" />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-[10px] bg-danger px-[5px] text-[11px] font-bold text-white">
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
      <div className="flex-1" />
      <Link href="/" className="flex items-center gap-2.5 rounded-xl px-3 py-[11px] text-[13px] font-semibold text-sub">
        <Smartphone className="size-[17px]" />
        사용자 앱 보기
      </Link>
      <div className="mt-2 flex items-center gap-2.5 border-t border-line p-3">
        <span className="grid size-[34px] place-items-center rounded-full bg-ink text-white">
          <ShieldCheck className="size-[17px]" />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-bold">{nickname}</span>
          <span className="text-[11px] text-muted">운영자</span>
        </div>
      </div>
    </aside>
  )
}
