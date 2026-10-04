"use client"

import { Mail, Shield, UserCheck, UserX } from "lucide-react"
import { useState } from "react"

import type { AdminUserListItem } from "@/lib/api"
import { formatDate } from "@/lib/issues"
import { useAllAdminUsers, useSetUserRole, useSetUserSuspended } from "@/lib/queries/admin"
import { tierLabel } from "@/lib/tier"
import { cn } from "@/lib/utils"
import { useAdminUI } from "@/components/admin/admin-ui"
import { EmptyState, SearchBox, SegTabs } from "@/components/admin/parts"
import { Avatar } from "@/components/ui/brand"
import { useToast } from "@/components/ui/toast"

type UserFilter = "all" | "active" | "suspended"

const VIA_LABEL: Record<string, string> = { kakao: "카카오", google: "Google", apple: "Apple", email: "이메일" }

export default function AdminUsersPage() {
  const [filter, setFilter] = useState<UserFilter>("all")
  const [query, setQuery] = useState("")
  const { data, isLoading, error } = useAllAdminUsers()

  const users = data?.items ?? []
  const q = query.trim().toLowerCase()
  const list = users.filter(
    (u) =>
      (filter === "all" || (filter === "suspended" ? u.suspended : !u.suspended)) &&
      (!q || `${u.nickname}${u.email ?? ""}`.toLowerCase().includes(q)),
  )

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <SegTabs
          tabs={[
            { key: "all", label: "전체", count: users.length },
            { key: "active", label: "활동 중", count: users.filter((u) => !u.suspended).length },
            { key: "suspended", label: "정지", count: users.filter((u) => u.suspended).length },
          ]}
          value={filter}
          onChange={setFilter}
        />
        <div className="flex-1" />
        <SearchBox value={query} onChange={setQuery} placeholder="닉네임, 이메일 검색" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3.5">
        {list.map((u) => (
          <UserCard key={u.id} user={u} />
        ))}
      </div>
      {list.length === 0 && <EmptyState text={error ? error.message : isLoading ? "불러오는 중..." : "항목이 없어요"} />}
    </>
  )
}

function UserCard({ user: u }: { user: AdminUserListItem }) {
  const ui = useAdminUI()
  const showToast = useToast()
  const setRole = useSetUserRole()
  const setSuspended = useSetUserSuspended()
  const isAdmin = u.role === "ADMIN"

  function toggleRole() {
    ui.askGeneric({
      title: isAdmin ? "관리자 권한을 해제할까요?" : "관리자로 지정할까요?",
      description: isAdmin
        ? `${u.nickname}님은 더 이상 관리자 페이지에 접근할 수 없어요.`
        : `${u.nickname}님이 이슈 생성·결과 확정 등 모든 관리 기능을 쓸 수 있게 돼요.`,
      okLabel: isAdmin ? "해제" : "지정",
      danger: false,
      onOk: async () => {
        await setRole.mutateAsync({ userId: u.id, role: isAdmin ? "USER" : "ADMIN" })
        showToast("권한을 변경했어요")
      },
    })
  }

  function toggleSuspend() {
    if (u.suspended) {
      setSuspended.mutate(
        { userId: u.id, suspended: false },
        { onSuccess: () => showToast("활동 정지를 해제했어요"), onError: (e) => showToast(e.message) },
      )
      return
    }
    ui.askGeneric({
      title: "활동을 정지할까요?",
      description: `${u.nickname}님은 투표, 댓글, 글쓰기를 할 수 없게 돼요.`,
      okLabel: "정지",
      onOk: async () => {
        await setSuspended.mutateAsync({ userId: u.id, suspended: true })
        showToast("활동을 정지했어요")
      },
    })
  }

  return (
    <div className={cn("flex flex-col gap-4 rounded-[22px] bg-surface p-5", u.suspended && "opacity-70")}>
      <div className="flex items-center gap-3">
        <Avatar nickname={u.nickname} className="size-[46px] text-[17px]" />
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-bold">{u.nickname}</span>
            {isAdmin && (
              <span className="rounded-[5px] bg-ink px-1.5 py-0.5 text-[10px] font-bold text-white">관리자</span>
            )}
          </div>
          <span className="flex items-center gap-1 truncate text-xs text-muted">
            <Mail className="size-[13px] flex-none" />
            {u.email ?? "-"}
          </span>
        </div>
        <span
          className={cn(
            "rounded-[7px] px-2 py-1 text-[11px] font-bold",
            u.suspended ? "bg-danger-soft text-danger-ink" : "bg-success-soft text-success",
          )}
        >
          {u.suspended ? "정지" : "활동 중"}
        </span>
      </div>
      <div className="grid grid-cols-3 rounded-[14px] bg-bg px-1 py-3">
        {[
          { value: u.credibilityScore.toLocaleString(), label: "신용도" },
          { value: tierLabel(u.tier), label: "티어" },
          { value: u.via ? (VIA_LABEL[u.via] ?? u.via) : "-", label: "가입 경로" },
        ].map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1">
            <span className="text-[15px] font-extrabold tabular-nums">{s.value}</span>
            <span className="text-[11px] text-muted">{s.label}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="flex-1 text-xs text-muted">{formatDate(u.createdAt)} 가입</span>
        <button
          type="button"
          onClick={toggleRole}
          className="flex h-[34px] items-center gap-1 rounded-[10px] border-[1.5px] border-line-2 bg-surface px-[11px] text-xs font-bold text-ink"
        >
          <Shield className="size-3.5" />
          {isAdmin ? "권한 해제" : "관리자 지정"}
        </button>
        <button
          type="button"
          onClick={toggleSuspend}
          className={cn(
            "flex h-[34px] items-center gap-1 rounded-[10px] px-[11px] text-xs font-bold",
            u.suspended ? "bg-success-soft text-success" : "bg-danger-soft text-danger-ink",
          )}
        >
          {u.suspended ? <UserCheck className="size-3.5" /> : <UserX className="size-3.5" />}
          {u.suspended ? "정지 해제" : "활동 정지"}
        </button>
      </div>
    </div>
  )
}
