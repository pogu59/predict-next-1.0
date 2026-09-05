"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { type BackendRole } from "@/lib/api"
import { useAdminUsers } from "@/lib/queries/admin"
import { tierLabel } from "@/lib/tier"
import { Badge } from "@/components/admin/badge"
import { Select, TextInput } from "@/components/admin/controls"
import { DataTable } from "@/components/admin/dataTable"
import { Pagination } from "@/components/admin/pagination"

const ROLE_OPTIONS: BackendRole[] = ["USER", "ADMIN"]
const ROLE_LABELS: Record<BackendRole, string> = { USER: "일반", ADMIN: "관리자" }

export default function AdminUsersPage() {
  const router = useRouter()
  const [page, setPage] = useState(0)
  const [keyword, setKeyword] = useState("")
  const [role, setRole] = useState("")

  const {
    data: listResult,
    isLoading: loading,
    error,
  } = useAdminUsers({
    keyword: keyword || undefined,
    role: (role as BackendRole) || undefined,
    page,
    size: 20,
  })
  const items = listResult?.items ?? []
  const totalPages = listResult?.totalPages ?? 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <TextInput
          value={keyword}
          onChange={(e) => {
            setPage(0)
            setKeyword(e.target.value)
          }}
          placeholder="닉네임 검색"
        />
        <Select
          value={role}
          onChange={(e) => {
            setPage(0)
            setRole(e.target.value)
          }}
        >
          <option value="">전체 권한</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </Select>
      </div>

      {error && (
        <div className="border-wrong bg-wrong-chip rounded-lg border px-4 py-2.5 text-caption text-wrong">
          {error.message}
        </div>
      )}

      <DataTable
        rows={items}
        rowKey={(user) => user.id}
        onRowClick={(user) => router.push(`/admin/users/${user.id}`)}
        loading={loading}
        emptyMessage="조건에 맞는 유저가 없어요"
        columns={[
          { header: "닉네임", render: (u) => <span className="text-ink font-bold">{u.nickname}</span> },
          { header: "티어", render: (u) => <span className="text-ink-muted">{tierLabel(u.tier)}</span> },
          {
            header: "신용도",
            render: (u) => (
              <span className="text-ink-muted tabular-nums">{u.credibilityScore.toLocaleString()}</span>
            ),
          },
          { header: "권한", render: (u) => (u.role === "ADMIN" ? <Badge tone="accent">관리자</Badge> : null) },
          {
            header: "가입일",
            render: (u) => (
              <span className="text-ink-muted">{new Date(u.createdAt).toLocaleDateString("ko-KR")}</span>
            ),
          },
        ]}
      />

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  )
}
