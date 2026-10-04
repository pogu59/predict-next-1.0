"use client"

import {
  Bell,
  ChevronRight,
  FileText,
  LogOut,
  PenLine,
  Settings,
  ShieldCheck,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import type { MyVote } from "@/lib/api"
import { useCredit } from "@/lib/credit"
import { CHIP_CLASS, issueChip, useNow } from "@/lib/issues"
import { useLogout, useMe } from "@/lib/queries/auth"
import { usePosts } from "@/lib/queries/post"
import { useMyStats } from "@/lib/queries/user"
import { TierIcon, tierLabel } from "@/lib/tier"
import { cn } from "@/lib/utils"
import { CreditCard } from "@/components/credit-card"
import { Avatar, Chip } from "@/components/ui/brand"
import { ImageBox } from "@/components/ui/image-box"
import { ConfirmDialog } from "@/components/ui/overlay"

function voteChip(v: MyVote, now: Date) {
  if (v.status === "OPEN") return { label: "진행 중", className: CHIP_CLASS.open }
  return issueChip(v, { optionId: v.optionId, scoreDelta: v.scoreDelta }, now)
}

export default function MyPage() {
  const router = useRouter()
  const now = useNow(60_000)
  const { isLoading: meLoading } = useMe()
  const { me, votes } = useCredit()
  const { data: stats } = useMyStats(me?.userId)
  const { data: posts } = usePosts({ author: "me", sort: "new", size: 50 })
  const logout = useLogout()
  const [askLogout, setAskLogout] = useState(false)

  useEffect(() => {
    if (!meLoading && !me) router.replace("/login")
  }, [meLoading, me, router])

  if (!me) return null

  const myPostCount = (posts?.items ?? []).filter((p) => p.authorNickname === me.nickname).length
  const accuracy =
    stats && stats.gradedCount > 0 ? Math.round((stats.correctCount / stats.gradedCount) * 100) : 0
  const isAdmin = me.role === "ADMIN"

  function doLogout() {
    logout()
    setAskLogout(false)
    router.replace("/login")
  }

  const menuRow = (Icon: LucideIcon, label: string, pc: boolean, trailing?: React.ReactNode, iconClass = "text-sub") => (
    <>
      <Icon className={cn(pc ? "size-[19px]" : "size-[22px]", iconClass)} />
      <span className="flex-1 text-[15px] font-semibold">{label}</span>
      {trailing}
    </>
  )
  const chevron = (pc: boolean) => (
    <ChevronRight className={cn("text-disabled-ink", pc ? "size-[17px]" : "size-5")} />
  )
  const rowClass = (pc: boolean) =>
    cn("flex items-center gap-3 text-left", pc ? "px-5 py-3.5 hover:bg-[#FAFAF9]" : "px-[18px] py-3.5")

  return (
    <>
      {/* 모바일 */}
      <div className="pb-[100px] lg:hidden">
        <div className="flex items-center justify-between px-5 pt-2 pb-3.5">
          <h1 className="text-2xl font-extrabold tracking-[-0.04em]">마이</h1>
          <Settings className="size-6 text-sub" />
        </div>
        <div className="flex flex-col gap-2.5 px-4">
          <div className="flex items-center gap-3.5 rounded-[22px] bg-surface p-[18px]">
            <Avatar nickname={me.nickname} className="size-[52px] text-lg" />
            <div className="flex flex-1 flex-col gap-[5px]">
              <span className="text-lg font-extrabold tracking-[-0.02em]">{me.nickname}</span>
              <span className="flex items-center gap-[5px] text-[13px] font-semibold text-sub">
                <TierIcon tier={me.tier} size={16} />
                {tierLabel(me.tier)}
              </span>
            </div>
            <span className="text-[13px] font-semibold text-muted">편집</span>
          </div>
          <CreditCard header="label" className="rounded-[22px] p-5" />
          <div className="grid grid-cols-3 rounded-[22px] bg-surface px-2 py-[18px]">
            {[
              { value: String(stats?.totalVotes ?? 0), label: "예측" },
              { value: `${accuracy}%`, label: "적중률" },
              { value: String(myPostCount), label: "작성글" },
            ].map((s, i) => (
              <div
                key={s.label}
                className={cn("flex flex-col items-center gap-1.5", i === 1 && "border-x border-line")}
              >
                <span className="text-[22px] font-extrabold tabular-nums">{s.value}</span>
                <span className="text-xs font-semibold text-muted">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col rounded-[22px] bg-surface px-[18px] pt-[18px] pb-2">
            <span className="pb-1.5 text-base font-extrabold">내 예측</span>
            {votes.map((v) => {
              const chip = voteChip(v, now)
              return (
                <Link
                  key={v.voteId}
                  href={`/issue/${v.issueId}`}
                  className="flex items-center gap-3 border-t border-line-3 py-3"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-sm font-semibold">{v.title}</span>
                    <span className="text-xs text-muted">
                      {v.optionText} · {v.stake} 걸림
                    </span>
                  </div>
                  <Chip className={cn("whitespace-nowrap", chip.className)}>{chip.label}</Chip>
                </Link>
              )
            })}
          </div>
          <div className="flex flex-col rounded-[22px] bg-surface py-1.5">
            <Link href="/board?author=me" className={rowClass(false)}>
              {menuRow(FileText, "내가 쓴 글", false, chevron(false))}
            </Link>
            <div className={rowClass(false)}>{menuRow(Bell, "알림 설정", false, chevron(false))}</div>
            {isAdmin && (
              <Link href="/admin" className={rowClass(false)}>
                {menuRow(
                  ShieldCheck,
                  "관리자 페이지",
                  false,
                  <>
                    <span className="text-xs font-semibold text-muted">PC 전용</span>
                    {chevron(false)}
                  </>,
                  "text-brand",
                )}
              </Link>
            )}
            <button type="button" onClick={() => setAskLogout(true)} className={rowClass(false)}>
              {menuRow(LogOut, "로그아웃", false)}
            </button>
          </div>
        </div>
      </div>

      {/* PC */}
      <div className="hidden grid-cols-[340px_minmax(0,1fr)] items-start gap-7 lg:grid">
        <div className="sticky top-[92px] flex flex-col gap-3.5">
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface p-6 text-center">
            <Avatar nickname={me.nickname} className="size-[88px] text-[30px]" />
            <span className="text-xl font-extrabold tracking-[-0.02em]">{me.nickname}</span>
            <span className="flex items-center gap-[5px] text-sm font-semibold text-sub">
              <TierIcon tier={me.tier} size={18} />
              {tierLabel(me.tier)}
            </span>
          </div>
          <CreditCard header="label" className="rounded-3xl p-[22px]" />
          <div className="flex flex-col rounded-3xl bg-surface py-1.5">
            <Link href="/board?author=me" className={rowClass(true)}>
              {menuRow(FileText, "내가 쓴 글", true, <span className="text-[13px] text-faint">{myPostCount}</span>)}
            </Link>
            <div className={rowClass(true)}>{menuRow(Bell, "알림 설정", true, chevron(true))}</div>
            <div className={rowClass(true)}>{menuRow(Settings, "계정 설정", true, chevron(true))}</div>
            {isAdmin && (
              <Link href="/admin" className={rowClass(true)}>
                {menuRow(ShieldCheck, "관리자 페이지", true, chevron(true), "text-brand")}
              </Link>
            )}
            <button type="button" onClick={() => setAskLogout(true)} className={rowClass(true)}>
              {menuRow(LogOut, "로그아웃", true)}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-3.5">
          <div className="grid grid-cols-3 gap-3.5">
            {[
              { Icon: Target, value: String(stats?.totalVotes ?? 0), label: "참여한 예측" },
              { Icon: Trophy, value: `${accuracy}%`, label: "적중률" },
              { Icon: PenLine, value: String(myPostCount), label: "작성한 글" },
            ].map(({ Icon, value, label }) => (
              <div key={label} className="flex flex-col gap-2.5 rounded-[22px] bg-surface p-5">
                <Icon className="size-5 text-brand" />
                <span className="text-[28px] font-extrabold tabular-nums">{value}</span>
                <span className="text-[13px] font-semibold text-muted">{label}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col rounded-3xl bg-surface px-6 pt-[22px] pb-2.5">
            <span className="pb-2 text-lg font-extrabold">내 예측</span>
            {votes.map((v) => {
              const chip = voteChip(v, now)
              return (
                <Link
                  key={v.voteId}
                  href={`/issue/${v.issueId}`}
                  className="flex items-center gap-3.5 border-t border-line-3 py-3.5"
                >
                  <ImageBox src={v.coverImageUrl} className="size-[52px] flex-none rounded-[14px]" iconSize={20} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-[15px] font-bold">{v.title}</span>
                    <span className="text-[13px] text-muted">
                      {v.optionText} · {v.stake} 걸림
                    </span>
                  </div>
                  <Chip className={cn("rounded-lg px-2.5 py-1.5 whitespace-nowrap", chip.className)}>{chip.label}</Chip>
                  <ChevronRight className="size-[18px] text-disabled-ink" />
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={askLogout}
        onOpenChange={setAskLogout}
        title="로그아웃 할까요?"
        description="다시 로그인해야 예측 기록과 신용도를 확인할 수 있어요."
        confirmLabel="로그아웃"
        onConfirm={doLogout}
      />
    </>
  )
}
