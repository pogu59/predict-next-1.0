"use client"

import { useState } from "react"

import { Pencil, Plus, Users } from "lucide-react"

import type { AdminCrew } from "@/lib/api"
import { formatDate } from "@/lib/issues"
import { useAdminCrews, useSaveAdminCrew } from "@/lib/queries/crew"
import { cn } from "@/lib/utils"
import { ActionButton, EmptyState } from "@/components/admin/parts"
import { useToast } from "@/components/ui/toast"

type Form = { name: string; slug: string; description: string; active: boolean }

const EMPTY: Form = { name: "", slug: "", description: "", active: true }

/** 관리자 크루 관리 — 추가·수정·비활성화(삭제 대신 비활성). */
export default function AdminCrewsPage() {
  const showToast = useToast()
  const { data: crews = [], isLoading, error } = useAdminCrews()
  const save = useSaveAdminCrew()
  const [editing, setEditing] = useState<AdminCrew | null>(null)
  const [form, setForm] = useState<Form>(EMPTY)

  function startCreate() {
    setEditing(null)
    setForm(EMPTY)
  }

  function startEdit(crew: AdminCrew) {
    setEditing(crew)
    setForm({
      name: crew.name,
      slug: crew.slug,
      description: crew.description ?? "",
      active: crew.active,
    })
  }

  function submit() {
    if (!form.name.trim() || save.isPending) return
    save.mutate(
      {
        crewId: editing?.id,
        payload: {
          name: form.name.trim(),
          slug: form.slug.trim() || undefined,
          description: form.description.trim() || undefined,
          active: form.active,
        },
      },
      {
        onSuccess: (crew) => {
          showToast(editing ? "크루를 수정했어요" : "크루를 만들었어요")
          startEdit(crew)
        },
        onError: (e) => showToast(e.message),
      },
    )
  }

  function toggleActive(crew: AdminCrew) {
    save.mutate(
      {
        crewId: crew.id,
        payload: {
          name: crew.name,
          slug: crew.slug,
          description: crew.description ?? undefined,
          active: !crew.active,
        },
      },
      {
        onSuccess: () =>
          showToast(
            crew.active ? "크루를 비활성화했어요" : "크루를 다시 열었어요",
          ),
        onError: (e) => showToast(e.message),
      },
    )
  }

  const input =
    "h-11 rounded-xl border-[1.5px] border-line-2 bg-surface px-3.5 text-sm outline-none focus:border-brand"

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_380px] items-start gap-5">
      <section className="flex flex-col rounded-3xl bg-surface p-6">
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-lg font-extrabold">크루 {crews.length}</h2>
          <ActionButton
            Icon={Plus}
            label="새 크루"
            tone="primary"
            onClick={startCreate}
          />
        </div>
        {isLoading || error ? (
          <EmptyState text={error ? error.message : "불러오는 중..."} />
        ) : crews.length === 0 ? (
          <EmptyState text="아직 크루가 없어요. 오른쪽에서 첫 크루를 만들어 주세요." />
        ) : (
          crews.map((crew) => (
            <div
              key={crew.id}
              className={cn(
                "flex items-center gap-4 border-t border-line-3 py-3.5 first-of-type:border-t-0",
                !crew.active && "opacity-55",
              )}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-center gap-2 text-[15px] font-bold">
                  {crew.name}
                  {!crew.active && (
                    <span className="rounded-md bg-line-3 px-1.5 py-0.5 text-[11px] font-bold text-sub">
                      비활성
                    </span>
                  )}
                </span>
                <span className="truncate text-xs text-muted">
                  /{crew.slug} · {formatDate(crew.createdAt)} 생성
                  {crew.description && ` · ${crew.description}`}
                </span>
              </div>
              <span className="flex items-center gap-1 text-[13px] font-semibold text-sub tabular-nums">
                <Users className="size-3.5" />
                {crew.memberCount}
              </span>
              <ActionButton
                Icon={Pencil}
                label="수정"
                onClick={() => startEdit(crew)}
              />
              <button
                type="button"
                onClick={() => toggleActive(crew)}
                className="h-9 rounded-[10px] bg-track px-3 text-[13px] font-bold text-sub"
              >
                {crew.active ? "비활성화" : "다시 열기"}
              </button>
            </div>
          ))
        )}
      </section>

      <section className="sticky top-7 flex flex-col gap-4 rounded-3xl bg-surface p-6">
        <h2 className="text-lg font-extrabold">
          {editing ? `${editing.name} 수정` : "새 크루"}
        </h2>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-sub">
            이름 (30자)
          </span>
          <input
            value={form.name}
            maxLength={30}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="예: 서울대 예측 동아리"
            className={input}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-sub">
            slug (비우면 자동)
          </span>
          <input
            value={form.slug}
            maxLength={40}
            onChange={(e) =>
              setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))
            }
            placeholder="영문 소문자·숫자·-"
            className={input}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-sub">
            설명 (200자)
          </span>
          <textarea
            value={form.description}
            maxLength={200}
            rows={3}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className="resize-none rounded-xl border-[1.5px] border-line-2 bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand"
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) =>
              setForm((f) => ({ ...f, active: e.target.checked }))
            }
            className="size-4 accent-brand"
          />
          활성(목록에 보이고 가입할 수 있어요)
        </label>
        <button
          type="button"
          onClick={submit}
          disabled={!form.name.trim() || save.isPending}
          className="h-[50px] rounded-[14px] bg-brand text-[15px] font-bold text-white disabled:bg-disabled-bg disabled:text-muted"
        >
          {editing ? "저장" : "만들기"}
        </button>
      </section>
    </div>
  )
}
