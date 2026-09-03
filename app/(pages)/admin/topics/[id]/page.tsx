"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import {
  ApiError,
  confirmTopicResult,
  correctTopicResult,
  extendTopicDeadline,
  fetchAdminTopicDetail,
  fetchCategories,
  updateTopic,
  type AdminTopicDetail,
  type Category,
} from "@/lib/api"
import { topicStatusLabel } from "@/lib/topicStatus"
import { Badge } from "@/components/admin/badge"
import { Select, TextInput } from "@/components/admin/controls"
import { Button } from "@/components/ui/button"

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

export default function AdminTopicDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const topicId = Number(params.id)

  const [topic, setTopic] = useState<AdminTopicDetail | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [editForm, setEditForm] = useState({
    categoryId: "",
    title: "",
    description: "",
    voteStartAt: "",
    voteDeadlineAt: "",
    options: ["", ""],
  })
  const [extendDeadline, setExtendDeadlineValue] = useState("")

  async function reload() {
    const result = await fetchAdminTopicDetail(topicId)
    setTopic(result)
    setEditForm({
      categoryId: String(result.categoryId),
      title: result.title,
      description: result.description ?? "",
      voteStartAt: toDateTimeLocal(result.voteStartAt),
      voteDeadlineAt: toDateTimeLocal(result.voteDeadlineAt),
      options: result.options.map((o) => o.text),
    })
    setExtendDeadlineValue(toDateTimeLocal(result.voteDeadlineAt))
  }

  useEffect(() => {
    fetchCategories().then(setCategories)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        await reload()
      } catch (e) {
        if (!cancelled)
          setError(
            e instanceof ApiError ? e.message : "주제를 불러오지 못했습니다",
          )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId])

  async function runAction(action: () => Promise<unknown>) {
    setActionError(null)
    setBusy(true)
    try {
      await action()
      await reload()
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : "처리에 실패했습니다")
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <div className="text-label text-ink-subtle">불러오는 중...</div>
  }
  if (error || !topic) {
    return (
      <div className="rounded-xl border border-dashed border-line-strong px-5 py-10 text-center text-label text-ink-subtle">
        {error ?? "존재하지 않는 주제입니다"}
      </div>
    )
  }

  const correctOption = topic.options.find(
    (o) => o.id === topic.correctOptionId,
  )

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={() => router.push("/admin")}
        className="w-fit text-caption text-ink-subtle hover:text-ink"
      >
        ← 목록으로
      </button>

      <div className="flex flex-col gap-3 rounded-xl border border-line bg-card p-5">
        <div className="flex items-center gap-2">
          <Badge>{topicStatusLabel(topic.status)}</Badge>
          <span className="text-label text-ink-subtle">
            {topic.categoryName}
          </span>
        </div>
        <h2 className="text-h2">{topic.title}</h2>
        {topic.description && (
          <p className="text-body text-ink-muted">{topic.description}</p>
        )}

        <div className="grid grid-cols-2 gap-2 text-caption text-ink-subtle sm:grid-cols-4">
          {topic.options.map((option) => (
            <div key={option.id}>
              {option.text}{" "}
              <span className="text-ink tabular-nums">
                {option.voteCount ?? "-"}
              </span>
            </div>
          ))}
          <div>
            참여자{" "}
            <span className="text-ink tabular-nums">{topic.totalVotes}</span>
          </div>
          <div>
            마감{" "}
            <span className="text-ink">
              {new Date(topic.voteDeadlineAt).toLocaleString("ko-KR")}
            </span>
          </div>
        </div>

        {topic.confirmedByNickname && (
          <div className="text-caption font-semibold text-ink-faint">
            {new Date(topic.confirmedAt!).toLocaleString("ko-KR")} ·{" "}
            {topic.confirmedByNickname}님이 확정
            {correctOption && ` · 정답 ${correctOption.text}`}
          </div>
        )}
      </div>

      {actionError && (
        <div className="text-label text-wrong">{actionError}</div>
      )}

      {topic.status === "PENDING_RESULT" && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-line-strong p-4">
          <span className="text-label text-ink-subtle">결과 확정</span>
          {topic.options.map((option) => (
            <Button
              key={option.id}
              type="button"
              disabled={busy}
              onClick={() =>
                runAction(() => confirmTopicResult(topicId, option.id))
              }
            >
              {option.text} 확정
            </Button>
          ))}
        </div>
      )}

      {topic.status === "CONFIRMED" && (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-line-strong p-4">
          <span className="text-label text-ink-subtle">오확정 정정</span>
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            onClick={() => {
              if (
                window.confirm(
                  "이 주제의 확정 결과를 정정할까요? 기존 정산은 무효 처리되고 유저 점수가 재계산됩니다.",
                )
              )
                runAction(() => correctTopicResult(topicId))
            }}
          >
            정정하기
          </Button>
        </div>
      )}

      {topic.canFullEdit && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const options = editForm.options
              .map((o) => o.trim())
              .filter(Boolean)
            if (options.length < 2) {
              setActionError("선택지는 2개 이상이어야 합니다")
              return
            }
            const now = new Date()
            const start = new Date(editForm.voteStartAt)
            const deadline = new Date(editForm.voteDeadlineAt)
            if (start < now || deadline < now) {
              setActionError("시작·마감 시각은 현재 시각 이후로 설정해야 합니다")
              return
            }
            if (deadline <= start) {
              setActionError("마감 시각은 시작 시각보다 늦어야 합니다")
              return
            }
            runAction(() =>
              updateTopic(topicId, {
                categoryId: Number(editForm.categoryId),
                title: editForm.title,
                description: editForm.description || null,
                voteStartAt: editForm.voteStartAt,
                voteDeadlineAt: editForm.voteDeadlineAt,
                options,
              }),
            )
          }}
          className="flex flex-col gap-3 rounded-xl border border-dashed border-line-strong p-4"
        >
          <span className="text-label text-ink-subtle">
            주제 수정 (참여자 0명이라 전체 수정 가능)
          </span>
          <div className="flex flex-wrap gap-2">
            <Select
              surface="bg"
              value={editForm.categoryId}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, categoryId: e.target.value }))
              }
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <TextInput
              surface="bg"
              value={editForm.title}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, title: e.target.value }))
              }
              className="min-w-60 flex-1"
            />
          </div>
          <TextInput
            surface="bg"
            value={editForm.description}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="설명"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-label text-ink-subtle">
              선택지(2개 이상)
            </label>
            {editForm.options.map((option, i) => (
              <div key={i} className="flex items-center gap-2">
                <TextInput
                  surface="bg"
                  value={option}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      options: f.options.map((o, oi) =>
                        oi === i ? e.target.value : o,
                      ),
                    }))
                  }
                  placeholder={`선택지 ${i + 1}`}
                  className="min-w-60 flex-1"
                />
                {editForm.options.length > 2 && (
                  <Button
                    type="button"
                    onClick={() =>
                      setEditForm((f) => ({
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
                setEditForm((f) => ({ ...f, options: [...f.options, ""] }))
              }
            >
              선택지 추가
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TextInput
              surface="bg"
              type="datetime-local"
              min={nowDateTimeLocal()}
              value={editForm.voteStartAt}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, voteStartAt: e.target.value }))
              }
            />
            <TextInput
              surface="bg"
              type="datetime-local"
              min={editForm.voteStartAt || nowDateTimeLocal()}
              value={editForm.voteDeadlineAt}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, voteDeadlineAt: e.target.value }))
              }
            />
          </div>
          <Button type="submit" disabled={busy}>
            저장
          </Button>
        </form>
      )}

      {topic.canExtendDeadline && !topic.canFullEdit && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            runAction(() => extendTopicDeadline(topicId, extendDeadline))
          }}
          className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-line-strong p-4"
        >
          <span className="text-label text-ink-subtle">
            참여자가 있어 마감시각 연장만 가능
          </span>
          <TextInput
            surface="bg"
            type="datetime-local"
            min={toDateTimeLocal(topic.voteDeadlineAt)}
            value={extendDeadline}
            onChange={(e) => setExtendDeadlineValue(e.target.value)}
          />
          <Button type="submit" disabled={busy}>
            연장
          </Button>
        </form>
      )}
    </div>
  )
}
