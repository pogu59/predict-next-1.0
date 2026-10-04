"use client"

import Link from "next/link"
import { useState } from "react"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Check, Search, Shield, Users } from "lucide-react"

import type { Crew } from "@/lib/api"
import { useCrews, useJoinCrew, useMyCrew } from "@/lib/queries/crew"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"

/**
 * 시트 — 모바일은 하단 바텀시트, PC(≥1024)는 중앙 420px 모달(overlay.tsx ActionSheet와 같은 규칙).
 * 크루 고르기와 크루 상위 멤버 보기가 같이 쓴다.
 */
export function CrewSheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: React.ReactNode
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-40 animate-fade-in bg-scrim" />
        <DialogPrimitive.Popup
          className={cn(
            "fixed inset-x-2 bottom-2 z-40 flex max-h-[80dvh] animate-sheet-up flex-col rounded-[28px] bg-surface px-4 pt-2.5 pb-4 outline-none",
            "lg:inset-x-auto lg:top-1/2 lg:bottom-auto lg:left-1/2 lg:w-[420px] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:animate-pop lg:rounded-3xl lg:p-5 lg:shadow-modal",
          )}
        >
          <div className="mb-2 h-1 w-9 self-center rounded-full bg-[#E0E0DD] lg:hidden" />
          <DialogPrimitive.Title className="px-1 pt-2 pb-3 text-[17px] font-extrabold lg:pt-0">
            {title}
          </DialogPrimitive.Title>
          {children}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/** 크루 고르기 — 검색 가능한 목록 → 확인("30일 동안 바꿀 수 없어요") → 가입. 409면 서버 message를 토스트. */
export function CrewPicker({
  open,
  onOpenChange,
  currentCrewId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentCrewId?: number | null
}) {
  const showToast = useToast()
  const { data: crews = [], isLoading } = useCrews()
  const join = useJoinCrew()
  const [query, setQuery] = useState("")
  const [picked, setPicked] = useState<Crew | null>(null)

  function close(next: boolean) {
    onOpenChange(next)
    if (!next) {
      setPicked(null)
      setQuery("")
    }
  }

  function confirm() {
    if (!picked || join.isPending) return
    join.mutate(picked.id, {
      onSuccess: () => {
        showToast(`${picked.name}에 들어갔어요`)
        close(false)
      },
      onError: (e) => showToast(e.message),
    })
  }

  const q = query.trim().toLowerCase()
  const list = crews.filter(
    (c) => !q || `${c.name}${c.description ?? ""}`.toLowerCase().includes(q),
  )

  return (
    <CrewSheet
      open={open}
      onOpenChange={close}
      title={picked ? "크루에 들어갈까요?" : "크루 고르기"}
    >
      {picked ? (
        <div className="flex flex-col gap-4 px-1">
          <p className="text-[15px] leading-[1.6] text-sub">
            <b className="font-bold text-ink">{picked.name}</b>에 들어갈까요?
            30일 동안 바꿀 수 없어요.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="h-[50px] flex-1 rounded-[14px] bg-track text-[15px] font-bold"
            >
              다시 고르기
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={join.isPending}
              className="h-[50px] flex-1 rounded-[14px] bg-brand text-[15px] font-bold text-white disabled:opacity-60"
            >
              들어가기
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mx-1 mb-2 flex h-11 flex-none items-center gap-2 rounded-[14px] bg-track px-3.5">
            <Search className="size-[18px] text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="크루 이름 검색"
              className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
            />
          </div>
          <div className="-mx-1 flex min-h-0 flex-col overflow-y-auto">
            {isLoading && (
              <span className="py-8 text-center text-sm text-faint">
                불러오는 중...
              </span>
            )}
            {!isLoading && list.length === 0 && (
              <span className="py-8 text-center text-sm text-faint">
                {crews.length === 0
                  ? "아직 열린 크루가 없어요"
                  : "검색 결과가 없어요"}
              </span>
            )}
            {list.map((c) => {
              const mine = c.id === currentCrewId
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={mine}
                  onClick={() => setPicked(c)}
                  className="flex items-center gap-3 rounded-[14px] px-3 py-3 text-left hover:bg-bg disabled:cursor-default"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-[15px] font-bold">
                      {c.name}
                    </span>
                    {c.description && (
                      <span className="truncate text-xs text-muted">
                        {c.description}
                      </span>
                    )}
                  </div>
                  <span className="flex flex-none items-center gap-1 text-xs font-semibold text-sub tabular-nums">
                    <Users className="size-3.5" />
                    {c.memberCount}
                  </span>
                  {mine && (
                    <Check className="size-[18px] flex-none text-brand" />
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </CrewSheet>
  )
}

/** 인원당 점수·기여 표기 — "+12.5", "-3", "0" */
export function signedScore(n: number) {
  const text = Math.abs(n).toLocaleString("ko-KR", { maximumFractionDigits: 2 })
  return n > 0 ? `+${text}` : n < 0 ? `-${text}` : "0"
}

/** 마이 프로필의 크루 줄 — 소속 크루 이름, 없으면 "크루 고르기" 링크(/crew). */
export function MyCrewLabel({
  userId,
  className,
}: {
  userId: number
  className?: string
}) {
  const { data, isLoading } = useMyCrew(userId)
  if (isLoading) return null
  return (
    <Link
      href="/crew"
      className={cn("flex items-center gap-[5px] font-semibold", className)}
    >
      <Shield className="size-3.5 flex-none" />
      {data?.crew ? (
        <span className="truncate text-sub">{data.crew.name}</span>
      ) : (
        <span className="text-brand">크루 고르기</span>
      )}
    </Link>
  )
}
