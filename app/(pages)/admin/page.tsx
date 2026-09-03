"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import {
  ApiError,
  createTopic,
  fetchAdminTopics,
  fetchCategories,
  type AdminTopicListItem,
  type BackendTopicStatus,
  type Category,
} from "@/lib/api"
import { topicStatusLabel } from "@/lib/topicStatus"
import { Badge } from "@/components/admin/badge"
import { Select, TextInput } from "@/components/admin/controls"
import { DataTable } from "@/components/admin/dataTable"
import { Pagination } from "@/components/admin/pagination"
import { Button } from "@/components/ui/button"

const STATUS_OPTIONS: BackendTopicStatus[] = [
  "OPEN",
  "PENDING_RESULT",
  "CONFIRMED",
]

function toDateTimeLocal(value: string) {
  return value.length >= 16 ? value.slice(0, 16) : value
}

export default function AdminTopicsPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<AdminTopicListItem[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(0)
  const [categoryId, setCategoryId] = useState<string>("")
  const [status, setStatus] = useState<string>("")
  const [keyword, setKeyword] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [form, setForm] = useState({
    categoryId: "",
    title: "",
    description: "",
    voteStartAt: "",
    voteDeadlineAt: "",
    options: ["", ""],
  })

  useEffect(() => {
    fetchCategories().then(setCategories)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchAdminTopics({
          categoryId: categoryId ? Number(categoryId) : undefined,
          status: (status as BackendTopicStatus) || undefined,
          keyword: keyword || undefined,
          page,
          size: 20,
        })
        if (cancelled) return
        setItems(result.items)
        setTotalPages(result.totalPages)
      } catch (e) {
        if (!cancelled)
          setError(
            e instanceof ApiError ? e.message : "목록을 불러오지 못했습니다",
          )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [categoryId, status, keyword, page])

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
    setCreating(true)
    try {
      await createTopic({
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
      const result = await fetchAdminTopics({ page: 0, size: 20 })
      setItems(result.items)
      setTotalPages(result.totalPages)
    } catch (e) {
      setCreateError(
        e instanceof ApiError ? e.message : "주제 생성에 실패했습니다",
      )
    } finally {
      setCreating(false)
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
              {topicStatusLabel(s)}
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
              value={toDateTimeLocal(form.voteStartAt)}
              onChange={(e) =>
                setForm((f) => ({ ...f, voteStartAt: e.target.value }))
              }
            />
            <label className="text-label text-ink-subtle">마감</label>
            <TextInput
              type="datetime-local"
              value={toDateTimeLocal(form.voteDeadlineAt)}
              onChange={(e) =>
                setForm((f) => ({ ...f, voteDeadlineAt: e.target.value }))
              }
            />
          </div>
          {createError && (
            <div className="text-label text-wrong">{createError}</div>
          )}
          <Button type="submit" disabled={creating}>
            {creating ? "등록 중..." : "등록"}
          </Button>
        </form>
      )}

      {error && (
        <div className="rounded-lg border border-wrong bg-wrong-chip px-4 py-2.5 text-caption text-[#D6DEEC]">
          {error}
        </div>
      )}

      <DataTable
        rows={items}
        rowKey={(topic) => topic.id}
        onRowClick={(topic) => router.push(`/admin/topics/${topic.id}`)}
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
            render: (t) => <Badge>{topicStatusLabel(t.status)}</Badge>,
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
