"use client"

import { useState } from "react"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { CirclePlus, Minus, Play, Plus, Square, Trash2, X } from "lucide-react"

import type {
  AdminMissionCreateReq,
  AdminMissionListItem,
  MissionStatus,
  MissionType,
} from "@/lib/api"
import { DAY, formatDateTime, HOUR, toDateTimeLocal } from "@/lib/issues"
import { formatPoints, MISSION_TYPE_LABEL } from "@/lib/mission"
import {
  useAdminMissions,
  useCloseAdminMission,
  useCreateAdminMission,
  useOpenAdminMission,
} from "@/lib/queries/admin"
import { cn } from "@/lib/utils"
import { useAdminUI } from "@/components/admin/admin-ui"
import { ActionButton, EmptyState, SegTabs } from "@/components/admin/parts"
import { MissionTypeTile } from "@/components/mission-parts"
import { useToast } from "@/components/ui/toast"

type Filter = "ALL" | MissionStatus

const STATUS_CHIP: Record<MissionStatus, { label: string; className: string }> =
  {
    OPEN: { label: "공개 중", className: "bg-brand-soft text-brand" },
    DRAFT: { label: "작성 중", className: "bg-warn-soft text-warn-ink" },
    CLOSED: { label: "마감", className: "bg-line-3 text-sub" },
  }

export default function AdminMissionsPage() {
  const [filter, setFilter] = useState<Filter>("ALL")
  const [draft, setDraft] = useState<MissionForm | null>(null)
  const { data: missions = [], isLoading, error } = useAdminMissions()
  const count = (s: MissionStatus) =>
    missions.filter((m) => m.status === s).length
  const shown =
    filter === "ALL" ? missions : missions.filter((m) => m.status === filter)

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <SegTabs
          tabs={[
            { key: "ALL", label: "전체", count: missions.length },
            { key: "OPEN", label: "공개 중", count: count("OPEN") },
            { key: "DRAFT", label: "작성 중", count: count("DRAFT") },
            { key: "CLOSED", label: "마감", count: count("CLOSED") },
          ]}
          value={filter}
          onChange={setFilter}
        />
        <span className="flex-1" />
        <button
          type="button"
          // 기본 기간(지금 ~ 내일 같은 시각)은 여는 순간의 시각으로 정한다.
          onClick={() => setDraft(emptyForm(Date.now()))}
          className="flex h-[46px] items-center gap-[7px] rounded-[14px] bg-brand pr-5 pl-4 text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(91,75,255,.25)] hover:bg-brand-hover"
        >
          <Plus className="size-[19px]" />새 미션 만들기
        </button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-3.5">
        {shown.map((m) => (
          <MissionCard key={m.id} mission={m} />
        ))}
      </div>
      {shown.length === 0 && (
        <EmptyState
          text={
            error
              ? error.message
              : isLoading
                ? "불러오는 중..."
                : "해당하는 미션이 없어요"
          }
        />
      )}

      {draft && (
        <MissionDrawer initial={draft} onClose={() => setDraft(null)} />
      )}
    </>
  )
}

function MissionCard({ mission: m }: { mission: AdminMissionListItem }) {
  const ui = useAdminUI()
  const showToast = useToast()
  const open = useOpenAdminMission()
  const close = useCloseAdminMission()
  const chip = STATUS_CHIP[m.status]
  const judged = m.approvedCount + m.rejectedCount
  const rejectRate =
    judged > 0 ? Math.round((m.rejectedCount / judged) * 100) : 0

  return (
    <div className="flex flex-col gap-3.5 rounded-[22px] bg-surface p-5">
      <div className="flex items-center gap-2.5">
        <MissionTypeTile type={m.type} className="size-10 rounded-xl" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-sub">
            {MISSION_TYPE_LABEL[m.type]}
            {m.daily && (
              <span className="rounded-md bg-warn-soft px-1.5 py-0.5 text-warn-ink">
                오늘의 미션
              </span>
            )}
            <span className={cn("rounded-md px-1.5 py-0.5", chip.className)}>
              {chip.label}
            </span>
          </span>
          <span className="truncate text-[15px] font-bold">{m.title}</span>
        </div>
        <span className="flex-none text-base font-extrabold tabular-nums">
          +{formatPoints(m.rewardPoints)}
        </span>
      </div>
      <dl className="grid grid-cols-[64px_1fr] gap-x-3 gap-y-1.5 rounded-[14px] bg-bg px-4 py-3 text-[13px] tabular-nums">
        <dt className="font-semibold text-sub">기간</dt>
        <dd>
          {formatDateTime(m.startsAt)} ~ {formatDateTime(m.endsAt)}
        </dd>
        <dt className="font-semibold text-sub">문항</dt>
        <dd>
          {m.type === "ATTENDANCE" ? "없음(출석)" : `${m.questionCount}개`}
        </dd>
        <dt className="font-semibold text-sub">검수</dt>
        <dd>
          통과 {m.approvedCount.toLocaleString()} · 반려{" "}
          {m.rejectedCount.toLocaleString()}
          {judged > 0 && (
            <span
              className={cn(
                "ml-1.5 font-bold",
                rejectRate > 10 ? "text-danger-ink" : "text-sub",
              )}
            >
              반려율 {rejectRate}%
            </span>
          )}
        </dd>
      </dl>
      <div className="flex gap-2">
        {m.status === "OPEN" ? (
          <ActionButton
            Icon={Square}
            label="마감하기"
            tone="danger"
            onClick={() =>
              ui.askGeneric({
                title: "미션을 마감할까요?",
                description: `미션 탭에서 바로 사라지고 더 이상 참여할 수 없어요. 참여자가 이미 받은 포인트는 그대로예요. (${m.title})`,
                okLabel: "마감",
                onOk: async () => {
                  await close.mutateAsync(m.id)
                  showToast("미션을 마감했어요")
                },
              })
            }
          />
        ) : (
          <ActionButton
            Icon={Play}
            label={m.status === "DRAFT" ? "공개하기" : "다시 공개"}
            tone="primary"
            onClick={() =>
              open.mutate(m.id, {
                onSuccess: () => showToast("미션을 공개했어요"),
                onError: (e) => showToast(e.message),
              })
            }
          />
        )}
      </div>
    </div>
  )
}

// ---- 미션 만들기 드로어 ----

type QuestionForm = {
  text: string
  options: string[]
  /** 확인(주의) 문항이면 정답 보기 인덱스, 아니면 null. */
  answer: number | null
}

type MissionForm = {
  type: MissionType
  title: string
  description: string
  rewardPoints: string
  daily: boolean
  startsAt: string
  endsAt: string
  questions: QuestionForm[]
  openNow: boolean
}

const blankQuestion = (optionCount = 2): QuestionForm => ({
  text: "",
  options: Array.from({ length: optionCount }, () => ""),
  answer: null,
})

function emptyForm(nowMs: number): MissionForm {
  const start = Math.ceil(nowMs / 60_000) * 60_000
  return {
    type: "SURVEY",
    title: "",
    description: "",
    rewardPoints: "50",
    daily: false,
    startsAt: toDateTimeLocal(start),
    endsAt: toDateTimeLocal(start + DAY),
    questions: [blankQuestion(4)],
    openNow: true,
  }
}

const TYPE_DEFAULTS: Record<
  MissionType,
  Pick<MissionForm, "rewardPoints" | "questions">
> = {
  ATTENDANCE: { rewardPoints: "10", questions: [] },
  BALANCE: { rewardPoints: "10", questions: [blankQuestion(2)] },
  SURVEY: { rewardPoints: "50", questions: [blankQuestion(4)] },
}

const MAX_QUESTIONS = 20

function validate(form: MissionForm) {
  const points = Number(form.rewardPoints)
  const pointsOk =
    form.rewardPoints.trim() !== "" &&
    Number.isInteger(points) &&
    points >= 0 &&
    points <= 100_000
  const periodOk =
    !!form.startsAt &&
    !!form.endsAt &&
    Date.parse(form.startsAt) < Date.parse(form.endsAt)
  const questionsOk =
    form.type === "ATTENDANCE" ||
    (form.questions.length > 0 &&
      form.questions.every(
        (q) =>
          q.text.trim() !== "" &&
          q.options.length >= 2 &&
          q.options.length <= 6 &&
          q.options.every((o) => o.trim() !== "") &&
          (q.answer === null || q.answer < q.options.length),
      ))
  const titleOk = form.title.trim() !== ""
  return {
    titleOk,
    pointsOk,
    periodOk,
    questionsOk,
    all: titleOk && pointsOk && periodOk && questionsOk,
  }
}

function toPayload(form: MissionForm): AdminMissionCreateReq {
  return {
    type: form.type,
    title: form.title.trim(),
    description: form.description.trim() || null,
    rewardPoints: Number(form.rewardPoints),
    // 출석은 오늘의 미션 보너스 계산에서 빠지므로 daily를 켜지 않는다.
    daily: form.type !== "ATTENDANCE" && form.daily,
    startsAt: form.startsAt,
    endsAt: form.endsAt,
    questions:
      form.type === "ATTENDANCE"
        ? []
        : form.questions.map((q) => ({
            text: q.text.trim(),
            options: q.options.map((o) => o.trim()),
            attentionAnswerIndex: q.answer,
          })),
    openNow: form.openNow,
  }
}

const inputClass =
  "h-[50px] rounded-[14px] border-[1.5px] px-4 text-[15px] text-ink outline-none"

function MissionDrawer({
  initial,
  onClose,
}: {
  initial: MissionForm
  onClose: () => void
}) {
  const showToast = useToast()
  const create = useCreateAdminMission()
  const [form, setForm] = useState(initial)
  const [tried, setTried] = useState(false)
  const v = validate(form)
  const set = (patch: Partial<MissionForm>) =>
    setForm((f) => ({ ...f, ...patch }))
  const setQuestion = (index: number, patch: Partial<QuestionForm>) =>
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) =>
        i === index ? { ...q, ...patch } : q,
      ),
    }))

  function changeType(type: MissionType) {
    if (type === form.type) return
    set({
      type,
      ...TYPE_DEFAULTS[type],
      daily: type === "ATTENDANCE" ? false : form.daily,
    })
  }

  function save() {
    if (!v.all) {
      setTried(true)
      return
    }
    if (create.isPending) return
    create.mutate(toPayload(form), {
      onSuccess: () => {
        onClose()
        showToast(form.openNow ? "미션을 공개했어요" : "미션을 저장했어요")
      },
      onError: (e) => showToast(e.message),
    })
  }

  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(open) => !open && !create.isPending && onClose()}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-40 animate-fade-in bg-[rgb(17_17_19/0.35)]" />
        <DialogPrimitive.Popup className="fixed inset-y-0 right-0 z-40 flex w-[560px] max-w-full animate-slide-in flex-col bg-surface shadow-[-20px_0_60px_rgba(0,0,0,.12)] outline-none">
          <div className="flex h-[68px] flex-none items-center justify-between border-b border-line px-7">
            <DialogPrimitive.Title className="flex items-center gap-2 text-xl font-extrabold tracking-[-0.03em]">
              <CirclePlus className="size-5 text-brand" />새 미션 만들기
            </DialogPrimitive.Title>
            <DialogPrimitive.Close aria-label="닫기">
              <X className="size-[22px] text-sub" />
            </DialogPrimitive.Close>
          </div>

          <div className="flex flex-1 flex-col gap-[22px] overflow-y-auto px-7 py-6">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold">유형</span>
              <div className="grid grid-cols-3 gap-2">
                {(["ATTENDANCE", "BALANCE", "SURVEY"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={form.type === t}
                    onClick={() => changeType(t)}
                    className={cn(
                      "flex h-12 items-center justify-center gap-2 rounded-[14px] border-[1.5px] text-sm font-bold",
                      form.type === t
                        ? "border-brand bg-brand-soft text-brand"
                        : "border-line-2 text-ink",
                    )}
                  >
                    {MISSION_TYPE_LABEL[t]}
                  </button>
                ))}
              </div>
              <span className="text-xs text-sub">
                {form.type === "ATTENDANCE"
                  ? "문항 없이 하루 한 번 누르면 적립돼요."
                  : form.type === "BALANCE"
                    ? "문항 1개, 보기 2개. 문항당 0.7초보다 빨리 답하면 반려돼요."
                    : "문항 여러 개, 보기 2~6개. 문항당 1.5초보다 빨리 답하면 반려돼요."}
              </span>
            </div>

            <label className="flex flex-col gap-2">
              <span className="flex justify-between text-sm font-bold">
                제목{" "}
                <span className="text-xs font-medium text-faint tabular-nums">
                  {form.title.length}/100
                </span>
              </span>
              <input
                value={form.title}
                onChange={(e) => set({ title: e.target.value })}
                maxLength={100}
                placeholder={
                  form.type === "ATTENDANCE"
                    ? "예: 출석 체크"
                    : "예: 하루 커피, 몇 잔 마시나요?"
                }
                className={cn(
                  inputClass,
                  tried && !v.titleOk ? "border-danger" : "border-line-2",
                )}
              />
              {tried && !v.titleOk && (
                <span className="text-xs text-danger">
                  제목을 입력해 주세요
                </span>
              )}
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-bold">
                설명{" "}
                <span className="text-xs font-medium text-faint">
                  선택 · 첫 문항 아래에 보여요
                </span>
              </span>
              <textarea
                value={form.description}
                onChange={(e) => set({ description: e.target.value })}
                maxLength={500}
                rows={2}
                placeholder="예: 평소 평일 기준으로 골라 주세요"
                className="resize-y rounded-[14px] border-[1.5px] border-line-2 px-4 py-3 text-[15px] leading-[1.6] outline-none"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold">리워드 포인트</span>
                <input
                  value={form.rewardPoints}
                  onChange={(e) =>
                    set({ rewardPoints: e.target.value.replace(/[^0-9]/g, "") })
                  }
                  inputMode="numeric"
                  className={cn(
                    inputClass,
                    "tabular-nums",
                    tried && !v.pointsOk ? "border-danger" : "border-line-2",
                  )}
                />
                {tried && !v.pointsOk && (
                  <span className="text-xs text-danger">
                    0~100,000 사이로 입력해 주세요
                  </span>
                )}
              </label>
              <label
                className={cn(
                  "flex items-center gap-2.5 self-end rounded-[14px] border-[1.5px] border-line-2 px-4 py-3.5 text-sm font-semibold",
                  form.type === "ATTENDANCE" && "opacity-50",
                )}
              >
                <input
                  type="checkbox"
                  checked={form.type !== "ATTENDANCE" && form.daily}
                  disabled={form.type === "ATTENDANCE"}
                  onChange={(e) => set({ daily: e.target.checked })}
                  className="size-[18px] accent-brand"
                />
                오늘의 미션(보너스 대상)
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold">공개 기간</span>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="datetime-local"
                  aria-label="시작"
                  value={form.startsAt}
                  onChange={(e) => set({ startsAt: e.target.value })}
                  className={cn(
                    inputClass,
                    tried && !v.periodOk ? "border-danger" : "border-line-2",
                  )}
                />
                <input
                  type="datetime-local"
                  aria-label="끝"
                  value={form.endsAt}
                  onChange={(e) => set({ endsAt: e.target.value })}
                  className={cn(
                    inputClass,
                    tried && !v.periodOk ? "border-danger" : "border-line-2",
                  )}
                />
              </div>
              <div className="flex gap-1.5">
                {[
                  { label: "+12시간", ms: 12 * HOUR },
                  { label: "+1일", ms: DAY },
                  { label: "+3일", ms: 3 * DAY },
                  { label: "+1주", ms: 7 * DAY },
                ].map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => {
                      const start = Date.parse(form.startsAt)
                      if (!Number.isNaN(start))
                        set({ endsAt: toDateTimeLocal(start + q.ms) })
                    }}
                    className="rounded-[10px] bg-track px-3 py-[7px] text-xs font-bold text-ink-2"
                  >
                    끝 = 시작 {q.label}
                  </button>
                ))}
              </div>
              {tried && !v.periodOk && (
                <span className="text-xs text-danger">
                  끝이 시작보다 뒤여야 해요
                </span>
              )}
            </div>

            {form.type !== "ATTENDANCE" && (
              <div className="flex flex-col gap-3">
                <span className="flex justify-between text-sm font-bold">
                  문항
                  <span className="text-xs font-medium text-faint">
                    확인 문항은 정답을 고르면 오답 제출을 반려해요
                  </span>
                </span>
                {form.questions.map((q, qi) => (
                  <QuestionEditor
                    key={qi}
                    index={qi}
                    question={q}
                    fixedOptions={form.type === "BALANCE"}
                    removable={
                      form.type === "SURVEY" && form.questions.length > 1
                    }
                    showError={tried}
                    onChange={(patch) => setQuestion(qi, patch)}
                    onRemove={() =>
                      set({
                        questions: form.questions.filter((_, i) => i !== qi),
                      })
                    }
                  />
                ))}
                {form.type === "SURVEY" &&
                  form.questions.length < MAX_QUESTIONS && (
                    <button
                      type="button"
                      onClick={() =>
                        set({
                          questions: [...form.questions, blankQuestion(4)],
                        })
                      }
                      className="flex h-11 items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-line-2 text-sm font-bold text-sub"
                    >
                      <Plus className="size-4" />
                      문항 추가
                    </button>
                  )}
                {tried && !v.questionsOk && (
                  <span className="text-xs text-danger">
                    모든 문항과 보기를 채워 주세요(보기 2~6개)
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-none items-center gap-3 border-t border-line px-7 py-4">
            <label className="flex flex-1 items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.openNow}
                onChange={(e) => set({ openNow: e.target.checked })}
                className="size-[18px] accent-brand"
              />
              만들자마자 공개
            </label>
            <DialogPrimitive.Close className="h-12 rounded-[14px] bg-track px-5 text-[15px] font-bold text-ink">
              취소
            </DialogPrimitive.Close>
            <button
              type="button"
              onClick={save}
              disabled={create.isPending}
              className="h-12 rounded-[14px] bg-brand px-6 text-[15px] font-bold text-white hover:bg-brand-hover disabled:opacity-60"
            >
              {create.isPending
                ? "저장하는 중..."
                : form.openNow
                  ? "만들고 공개"
                  : "저장"}
            </button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function QuestionEditor({
  index,
  question: q,
  fixedOptions,
  removable,
  showError,
  onChange,
  onRemove,
}: {
  index: number
  question: QuestionForm
  /** 밸런스 게임은 보기 2개 고정. */
  fixedOptions: boolean
  removable: boolean
  showError: boolean
  onChange: (patch: Partial<QuestionForm>) => void
  onRemove: () => void
}) {
  const attention = q.answer !== null
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl bg-bg p-4">
      <div className="flex items-center gap-2">
        <span className="grid size-7 flex-none place-items-center rounded-lg bg-brand-soft text-[13px] font-extrabold text-brand">
          {index + 1}
        </span>
        <input
          value={q.text}
          maxLength={200}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="문항을 입력해 주세요"
          aria-label={`${index + 1}번 문항`}
          className={cn(
            "h-11 min-w-0 flex-1 rounded-xl border-[1.5px] bg-surface px-3 text-[15px] outline-none",
            showError && !q.text.trim() ? "border-danger" : "border-line-2",
          )}
        />
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`${index + 1}번 문항 삭제`}
            className="grid size-9 place-items-center"
          >
            <Trash2 className="size-[18px] text-sub" />
          </button>
        )}
      </div>
      {q.options.map((option, oi) => (
        <div key={oi} className="flex items-center gap-2 pl-9">
          {attention && (
            <input
              type="radio"
              name={`answer-${index}`}
              checked={q.answer === oi}
              onChange={() => onChange({ answer: oi })}
              aria-label={`${oi + 1}번 보기를 정답으로`}
              className="size-[18px] flex-none accent-brand"
            />
          )}
          <input
            value={option}
            maxLength={100}
            onChange={(e) =>
              onChange({
                options: q.options.map((o, i) =>
                  i === oi ? e.target.value : o,
                ),
              })
            }
            placeholder={`보기 ${oi + 1}`}
            aria-label={`${index + 1}번 문항 보기 ${oi + 1}`}
            className={cn(
              "h-10 min-w-0 flex-1 rounded-[10px] border-[1.5px] bg-surface px-3 text-sm outline-none",
              showError && !option.trim() ? "border-danger" : "border-line-2",
            )}
          />
          {!fixedOptions && q.options.length > 2 && (
            <button
              type="button"
              onClick={() =>
                onChange({
                  options: q.options.filter((_, i) => i !== oi),
                  answer:
                    q.answer === null
                      ? null
                      : q.answer === oi
                        ? 0
                        : q.answer > oi
                          ? q.answer - 1
                          : q.answer,
                })
              }
              aria-label={`보기 ${oi + 1} 삭제`}
              className="grid size-8 place-items-center"
            >
              <Minus className="size-4 text-sub" />
            </button>
          )}
        </div>
      ))}
      <div className="flex items-center gap-3 pl-9">
        {!fixedOptions && q.options.length < 6 && (
          <button
            type="button"
            onClick={() => onChange({ options: [...q.options, ""] })}
            className="flex items-center gap-1 text-[13px] font-bold text-brand"
          >
            <Plus className="size-3.5" />
            보기 추가
          </button>
        )}
        <span className="flex-1" />
        <label className="flex items-center gap-1.5 text-[13px] font-semibold text-sub">
          <input
            type="checkbox"
            checked={attention}
            onChange={(e) => onChange({ answer: e.target.checked ? 0 : null })}
            className="size-4 accent-brand"
          />
          확인 문항(정답 있음)
        </label>
      </div>
    </div>
  )
}
