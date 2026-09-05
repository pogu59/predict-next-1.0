"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { type ApiError, type BackendIssueStatus } from "@/lib/api"
import { issueStatusLabel } from "@/lib/issueStatus"
import { useCategories } from "@/lib/queries/category"
import { useAdminIssues, useCreateAdminIssue } from "@/lib/queries/admin"
import { Badge } from "@/components/admin/badge"
import { Select, TextInput } from "@/components/admin/controls"
import { DataTable } from "@/components/admin/dataTable"
import { Pagination } from "@/components/admin/pagination"
import { Button } from "@/components/ui/button"

const STATUS_OPTIONS: BackendIssueStatus[] = [
  "OPEN",
  "PENDING_RESULT",
  "CONFIRMED",
]

function toDateTimeLocal(value: string) {
  return value.length >= 16 ? value.slice(0, 16) : value
}

/** <input type="datetime-local">의 min 속성/검증 기준값 — 로컬(브라우저) 시각 기준. */
function nowDateTimeLocal() {
  const d = new Date()
  d.setSeconds(0, 0)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminIssuesPage() {
  const router = useRouter()
  const [page, setPage] = useState(0)
  const [categoryId, setCategoryId] = useState<string>("")
  const [status, setStatus] = useState<string>("")
  const [keyword, setKeyword] = useState("")

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [form, setForm] = useState({
    categoryId: "",
    title: "",
    description: "",
    voteStartAt: "",
    voteDeadlineAt: "",
    options: ["", ""],
  })

  const { data: categories = [] } = useCategories()
  const {
    data: listResult,
    isLoading: loading,
    error,
  } = useAdminIssues({
    categoryId: categoryId ? Number(categoryId) : undefined,
    status: (status as BackendIssueStatus) || undefined,
    keyword: keyword || undefined,
    page,
    size: 20,
  })
  const items = listResult?.items ?? []
  const totalPages = listResult?.totalPages ?? 0

  const createIssue = useCreateAdminIssue()

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCreateError(null)
    const options = form.options.map((o) => o.trim()).filter(Boolean)
    if (
      !form.categoryId ||
      !form.title ||
      !form.voteStartAt ||
      !form.voteDeadlineAt ||
      options.length < 2
    ) {
      setCreateError(
        "카테고리/제목/시작·마감 시각/선택지(2개 이상)는 필수입니다",
      )
      return
    }
    const now = new Date()
    const start = new Date(form.voteStartAt)
    const deadline = new Date(form.voteDeadlineAt)
    if (start < now || deadline < now) {
      setCreateError("시작·마감 시각은 현재 시각 이후로 설정해야 합니다")
      return
    }
    if (deadline <= start) {
      setCreateError("마감 시각은 시작 시각보다 늦어야 합니다")
      return
    }
    setCreateError(null)
    try {
      await createIssue.mutateAsync({
        categoryId: Number(form.categoryId),
        title: form.title,
        description: form.description || null,
        voteStartAt: form.voteStartAt,
        voteDeadlineAt: form.voteDeadlineAt,
        options,
      })
      setForm({
        categoryId: "",
        title: "",
        description: "",
        voteStartAt: "",
        voteDeadlineAt: "",
        options: ["", ""],
      })
      setShowCreateForm(false)
      setPage(0)
    } catch (e) {
      setCreateError((e as ApiError).message ?? "주제 생성에 실패했습니다")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={categoryId}
          onChange={(e) => {
            setPage(0)
            setCategoryId(e.target.value)
          }}
        >
          <option value="">전체 카테고리</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>

        <Select
          value={status}
          onChange={(e) => {
            setPage(0)
            setStatus(e.target.value)
          }}
        >
          <option value="">전체 상태</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {issueStatusLabel(s)}
            </option>
          ))}
        </Select>

        <TextInput
          value={keyword}
          onChange={(e) => {
            setPage(0)
            setKeyword(e.target.value)
          }}
          placeholder="제목 검색"
        />

        <div className="flex-auto" />

        <Button type="button" onClick={() => setShowCreateForm((v) => !v)}>
          {showCreateForm ? "닫기" : "새 주제 등록"}
        </Button>
      </div>

      {showCreateForm && (
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-3 rounded-xl border border-dashed border-line-strong p-4"
        >
          <div className="flex flex-wrap gap-2">
            <Select
              value={form.categoryId}
              onChange={(e) =>
                setForm((f) => ({ ...f, categoryId: e.target.value }))
              }
            >
              <option value="">카테고리 선택</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <TextInput
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="제목"
              className="min-w-60 flex-1"
            />
          </div>
          <TextInput
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="설명(선택)"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-label text-ink-subtle">
              선택지(2개 이상)
            </label>
            {form.options.map((option, i) => (
              <div key={i} className="flex items-center gap-2">
                <TextInput
                  value={option}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      options: f.options.map((o, oi) =>
                        oi === i ? e.target.value : o,
                      ),
                    }))
                  }
                  placeholder={`선택지 ${i + 1}`}
                  className="min-w-60 flex-1"
                />
                {form.options.length > 2 && (
                  <Button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        options: f.options.filter((_, oi) => oi !== i),
                      }))
                    }
                  >
                    삭제
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              onClick={() =>
                setForm((f) => ({ ...f, options: [...f.options, ""] }))
              }
            >
              선택지 추가
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-label text-ink-subtle">투표 시작</label>
            <TextInput
              type="datetime-local"
              min={nowDateTimeLocal()}
              value={toDateTimeLocal(form.voteStartAt)}
              onChange={(e) =>
                setForm((f) => ({ ...f, voteStartAt: e.target.value }))
              }
            />
            <label className="text-label text-ink-subtle">마감</label>
            <TextInput
              type="datetime-local"
              min={form.voteStartAt || nowDateTimeLocal()}
              value={toDateTimeLocal(form.voteDeadlineAt)}
              onChange={(e) =>
                setForm((f) => ({ ...f, voteDeadlineAt: e.target.value }))
              }
            />
          </div>
          {createError && (
            <div className="text-label text-wrong">{createError}</div>
          )}
          <Button type="submit" disabled={createIssue.isPending}>
            {createIssue.isPending ? "등록 중..." : "등록"}
          </Button>
        </form>
      )}

      {error && (
        <div className="rounded-lg border border-wrong bg-wrong-chip px-4 py-2.5 text-caption text-wrong">
          {error.message}
        </div>
      )}

      <DataTable
        rows={items}
        rowKey={(issue) => issue.id}
        onRowClick={(issue) => router.push(`/admin/issues/${issue.id}`)}
        loading={loading}
        emptyMessage="조건에 맞는 주제가 없어요"
        minWidth="720px"
        columns={[
          {
            header: "제목",
            render: (t) => (
              <span className="font-bold text-ink">{t.title}</span>
            ),
          },
          {
            header: "카테고리",
            render: (t) => (
              <span className="text-ink-muted">{t.categoryName}</span>
            ),
          },
          {
            header: "상태",
            render: (t) => <Badge>{issueStatusLabel(t.status)}</Badge>,
          },
          {
            header: "참여자",
            render: (t) => (
              <span className="text-ink-muted tabular-nums">
                {t.totalVotes}
              </span>
            ),
          },
          {
            header: "마감시각",
            render: (t) => (
              <span className="text-ink-muted tabular-nums">
                {new Date(t.voteDeadlineAt).toLocaleString("ko-KR")}
              </span>
            ),
          },
        ]}
      />

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  )
}
