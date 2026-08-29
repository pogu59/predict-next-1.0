"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { ApiError, fetchAdminUsers, type AdminUserListItemDto, type BackendRole } from "@/lib/api"
import { tierLabel } from "@/lib/tier"
import { Badge } from "@/components/admin/badge"
import { Select, TextInput } from "@/components/admin/controls"
import { DataTable } from "@/components/admin/data-table"
import { Pagination } from "@/components/admin/pagination"

const ROLE_OPTIONS: BackendRole[] = ["USER", "ADMIN"]
const ROLE_LABELS: Record<BackendRole, string> = { USER: "일반", ADMIN: "관리자" }

export default function AdminUsersPage() {
  const router = useRouter()
  const [items, setItems] = useState<AdminUserListItemDto[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(0)
  const [keyword, setKeyword] = useState("")
  const [role, setRole] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchAdminUsers({
          keyword: keyword || undefined,
          role: (role as BackendRole) || undefined,
          page,
          size: 20,
        })
        if (cancelled) return
        setItems(result.items)
        setTotalPages(result.totalPages)
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "유저 목록을 불러오지 못했습니다")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [keyword, role, page])

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
        <div className="border-wrong bg-wrong-chip rounded-lg border px-4 py-2.5 text-[13px] font-bold text-[#D6DEEC]">
          {error}
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
