"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

import { type AdminIssueDetail, type ApiError, type Category, type IssueUpsertPayload } from "@/lib/api"
import { issueStatusLabel } from "@/lib/issueStatus"
import { useCategories } from "@/lib/queries/category"
import {
  useAdminIssue,
  useConfirmAdminIssue,
  useCorrectAdminIssue,
  useExtendAdminIssueDeadline,
  useUpdateAdminIssue,
} from "@/lib/queries/admin"
import { Badge } from "@/components/admin/badge"
import { Select, TextInput } from "@/components/admin/controls"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

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

export default function AdminIssueDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const issueId = Number(params.id)

  const { data: categories = [] } = useCategories()
  const { data: issue, isLoading: loading, error } = useAdminIssue(issueId)

  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [pendingConfirmOption, setPendingConfirmOption] = useState<{
    id: number
    text: string
  } | null>(null)
  const [showCorrectDialog, setShowCorrectDialog] = useState(false)
  // 액션(수정/연장 등)이 성공할 때마다 +1 — 아래 IssueForms를 이 값으로 key를 줘서
  // 서버가 돌려준 최신값으로 편집 폼을 다시 채운다(리렌더 중 setState 대신 리마운트로 처리).
  const [formResetKey, setFormResetKey] = useState(0)

  const updateIssue = useUpdateAdminIssue(issueId)
  const extendDeadlineMutation = useExtendAdminIssueDeadline(issueId)
  const confirmIssue = useConfirmAdminIssue(issueId)
  const correctIssue = useCorrectAdminIssue(issueId)

  async function runAction(action: () => Promise<unknown>) {
    setActionError(null)
    setBusy(true)
    try {
      await action()
      setFormResetKey((k) => k + 1)
    } catch (e) {
      setActionError((e as ApiError).message ?? "처리에 실패했습니다")
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <div className="text-label text-ink-subtle">불러오는 중...</div>
  }
  if (error || !issue) {
    return (
      <div className="rounded-xl border border-dashed border-line-strong px-5 py-10 text-center text-label text-ink-subtle">
        {error?.message ?? "존재하지 않는 주제입니다"}
      </div>
    )
  }

  const correctOption = issue.options.find(
    (o) => o.id === issue.correctOptionId,
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
          <Badge>{issueStatusLabel(issue.status)}</Badge>
          <span className="text-label text-ink-subtle">
            {issue.categoryName}
          </span>
        </div>
        <h2 className="text-h2">{issue.title}</h2>
        {issue.description && (
          <p className="text-body text-ink-muted">{issue.description}</p>
        )}

        <div className="grid grid-cols-2 gap-2 text-caption text-ink-subtle sm:grid-cols-4">
          {issue.options.map((option) => (
            <div key={option.id}>
              {option.text}{" "}
              <span className="text-ink tabular-nums">
                {option.voteCount ?? "-"}
              </span>
            </div>
          ))}
          <div>
            참여자{" "}
            <span className="text-ink tabular-nums">{issue.totalVotes}</span>
          </div>
          <div>
            마감{" "}
            <span className="text-ink">
              {new Date(issue.voteDeadlineAt).toLocaleString("ko-KR")}
            </span>
          </div>
        </div>

        {issue.confirmedByNickname && (
          <div className="text-caption font-semibold text-ink-faint">
            {new Date(issue.confirmedAt!).toLocaleString("ko-KR")} ·{" "}
            {issue.confirmedByNickname}님이 확정
            {correctOption && ` · 정답 ${correctOption.text}`}
          </div>
        )}
      </div>

      {actionError && (
        <div className="text-label text-wrong">{actionError}</div>
      )}

      {issue.status === "PENDING_RESULT" && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-line-strong p-4">
          <span className="text-label text-ink-subtle">결과 확정</span>
          {issue.options.map((option) => (
            <Button
              key={option.id}
              type="button"
              disabled={busy}
              onClick={() => setPendingConfirmOption(option)}
            >
              {option.text} 확정
            </Button>
          ))}
        </div>
      )}

      {issue.status === "CONFIRMED" && (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-line-strong p-4">
          <span className="text-label text-ink-subtle">오확정 정정</span>
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            onClick={() => setShowCorrectDialog(true)}
          >
            정정하기
          </Button>
        </div>
      )}

      <IssueForms
        key={formResetKey}
        issue={issue}
        categories={categories}
        busy={busy}
        onActionError={setActionError}
        onSave={(payload) => runAction(() => updateIssue.mutateAsync(payload))}
        onExtendDeadline={(newDeadline) => runAction(() => extendDeadlineMutation.mutateAsync(newDeadline))}
      />

      <ConfirmDialog
        open={pendingConfirmOption !== null}
        onOpenChange={(open) => !open && setPendingConfirmOption(null)}
        title="이 결과로 확정할까요?"
        description={`정답을 "${pendingConfirmOption?.text}"(으)로 확정하면 정산이 진행되고 되돌릴 수 없습니다.`}
        confirmLabel="확정하기"
        variant="destructive"
        onConfirm={() => {
          if (!pendingConfirmOption) return
          const optionId = pendingConfirmOption.id
          setPendingConfirmOption(null)
          runAction(() => confirmIssue.mutateAsync(optionId))
        }}
      />

      <ConfirmDialog
        open={showCorrectDialog}
        onOpenChange={setShowCorrectDialog}
        title="확정 결과를 정정할까요?"
        description="기존 정산은 무효 처리되고 유저 점수가 재계산됩니다. 이 작업은 되돌릴 수 없습니다."
        confirmLabel="정정하기"
        variant="destructive"
        onConfirm={() => {
          setShowCorrectDialog(false)
          runAction(() => correctIssue.mutateAsync())
        }}
      />
    </div>
  )
}

type IssueFormsProps = {
  issue: AdminIssueDetail
  categories: Category[]
  busy: boolean
  onActionError: (message: string) => void
  onSave: (payload: IssueUpsertPayload) => void
  onExtendDeadline: (newDeadline: string) => void
}

/**
 * 수정/마감연장 폼 + 그 로컬 편집 상태를 한 컴포넌트로 묶었다. 부모가 액션 성공마다
 * key를 바꿔 이 컴포넌트를 통째로 리마운트시키는 방식으로 "서버 최신값으로 폼 다시 채우기"를
 * 구현한다 — 렌더 중 다른 컴포넌트의 state를 setState하는 이펙트를 쓰지 않기 위함
 * (react-hooks/set-state-in-effect가 금지하는 패턴).
 */
function IssueForms({ issue, categories, busy, onActionError, onSave, onExtendDeadline }: IssueFormsProps) {
  const [editForm, setEditForm] = useState({
    categoryId: String(issue.categoryId),
    title: issue.title,
    description: issue.description ?? "",
    voteStartAt: toDateTimeLocal(issue.voteStartAt),
    voteDeadlineAt: toDateTimeLocal(issue.voteDeadlineAt),
    options: issue.options.map((o) => o.text),
  })
  const [extendDeadline, setExtendDeadlineValue] = useState(toDateTimeLocal(issue.voteDeadlineAt))

  return (
    <>
      {issue.canFullEdit && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const options = editForm.options.map((o) => o.trim()).filter(Boolean)
            if (options.length < 2) {
              onActionError("선택지는 2개 이상이어야 합니다")
              return
            }
            const now = new Date()
            const start = new Date(editForm.voteStartAt)
            const deadline = new Date(editForm.voteDeadlineAt)
            if (start < now || deadline < now) {
              onActionError("시작·마감 시각은 현재 시각 이후로 설정해야 합니다")
              return
            }
            if (deadline <= start) {
              onActionError("마감 시각은 시작 시각보다 늦어야 합니다")
              return
            }
            onSave({
              categoryId: Number(editForm.categoryId),
              title: editForm.title,
              description: editForm.description || null,
              voteStartAt: editForm.voteStartAt,
              voteDeadlineAt: editForm.voteDeadlineAt,
              options,
            })
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

      {issue.canExtendDeadline && !issue.canFullEdit && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onExtendDeadline(extendDeadline)
          }}
          className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-line-strong p-4"
        >
          <span className="text-label text-ink-subtle">
            참여자가 있어 마감시각 연장만 가능
          </span>
          <TextInput
            surface="bg"
            type="datetime-local"
            min={toDateTimeLocal(issue.voteDeadlineAt)}
            value={extendDeadline}
            onChange={(e) => setExtendDeadlineValue(e.target.value)}
          />
          <Button type="submit" disabled={busy}>
            연장
          </Button>
        </form>
      )}
    </>
  )
}
