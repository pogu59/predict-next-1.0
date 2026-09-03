"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { ApiError, fetchAdminUserDetail, type AdminUserDetail } from "@/lib/api"
import { tierLabel } from "@/lib/tier"
import { Badge } from "@/components/admin/badge"

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const userId = Number(params.id)

  const [user, setUser] = useState<AdminUserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchAdminUserDetail(userId)
      .then((result) => !cancelled && setUser(result))
      .catch((e) => !cancelled && setError(e instanceof ApiError ? e.message : "유저를 불러오지 못했습니다"))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [userId])

  if (loading) {
    return <div className="text-ink-subtle text-sm font-bold">불러오는 중...</div>
  }
  if (error || !user) {
    return (
      <div className="border-line-strong text-ink-subtle rounded-xl border border-dashed px-5 py-10 text-center text-sm font-bold">
        {error ?? "존재하지 않는 유저입니다"}
      </div>
    )
  }

  const accuracy = user.gradedCount > 0 ? Math.round((user.correctCount / user.gradedCount) * 100) : null

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={() => router.push("/admin/users")}
        className="text-ink-subtle hover:text-ink w-fit text-[12.5px] font-bold"
      >
        ← 목록으로
      </button>

      <div className="border-line bg-card flex flex-col gap-3 rounded-xl border p-5">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-extrabold tracking-[-0.03em]">{user.nickname}</h2>
          {user.role === "ADMIN" && <Badge tone="accent">관리자</Badge>}
          {user.activitySuppressed && <Badge tone="warning">활동성 강등 중</Badge>}
        </div>

        <div className="text-ink-subtle grid grid-cols-2 gap-3 text-[12.5px] font-bold sm:grid-cols-4">
          <div>
            티어 <span className="text-ink">{tierLabel(user.tier)}</span>
          </div>
          <div>
            신용도 <span className="text-ink tabular-nums">{user.credibilityScore.toLocaleString()}</span>
          </div>
          <div>
            총 투표 <span className="text-ink tabular-nums">{user.totalVotes}</span>
          </div>
          <div>
            정답률{" "}
            <span className="text-ink tabular-nums">
              {accuracy !== null ? `${accuracy}% (${user.correctCount}/${user.gradedCount})` : "-"}
            </span>
          </div>
        </div>

        <div className="text-ink-faint text-[11.5px] font-semibold">
          가입일 {new Date(user.createdAt).toLocaleString("ko-KR")}
        </div>
      </div>

      <div className="border-line-strong text-ink-subtle rounded-xl border border-dashed p-4 text-[12.5px] font-semibold">
        관리자 권한 부여/해제는 이 페이지에서 지원하지 않습니다. DB에서 users.role 값을 직접 수정해 주세요.
      </div>
    </div>
  )
}
