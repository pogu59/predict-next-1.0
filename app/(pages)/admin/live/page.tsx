"use client"

import { useState } from "react"

import {
  BadgeCheck,
  CircleMinus,
  CirclePlus,
  Radio,
  Trash2,
} from "lucide-react"

import type { AdminIssueListItem } from "@/lib/api"
import { MINUTE, optionPercents, toDateTimeLocal, useNow } from "@/lib/issues"
import { clockLabel, isLiveIssue } from "@/lib/live"
import {
  useAllAdminIssues,
  useConfirmAdminIssue,
  useCreateAdminIssue,
} from "@/lib/queries/admin"
import { cn } from "@/lib/utils"
import { useAdminUI } from "@/components/admin/admin-ui"
import { ActionButton, EmptyState } from "@/components/admin/parts"
import { useToast } from "@/components/ui/toast"

type Field = "team" | "batter" | "teamA" | "teamB"

type Template = {
  id: string
  sport: "야구" | "롤" | "자유"
  title: string
  options: string[]
  fields: Field[]
}

const TEMPLATES: Template[] = [
  {
    id: "bb-inning",
    sport: "야구",
    title: "이번 이닝, {팀}이 득점할까?",
    options: ["득점한다", "무득점"],
    fields: ["team"],
  },
  {
    id: "bb-batter",
    sport: "야구",
    title: "이번 타석, {타자} 출루할까?",
    options: ["출루(안타·볼넷·사구)", "아웃"],
    fields: ["batter"],
  },
  {
    id: "bb-next-run",
    sport: "야구",
    title: "이 경기 다음 점수는 어느 팀이?",
    options: ["{A}", "{B}", "남은 이닝 무득점"],
    fields: ["teamA", "teamB"],
  },
  {
    id: "lol-set",
    sport: "롤",
    title: "이번 세트 승리 팀은?",
    options: ["{A}", "{B}"],
    fields: ["teamA", "teamB"],
  },
  {
    id: "lol-baron",
    sport: "롤",
    title: "이번 세트 첫 바론은?",
    options: ["{A}", "{B}", "바론 없이 끝남"],
    fields: ["teamA", "teamB"],
  },
  {
    id: "lol-25",
    sport: "롤",
    title: "이번 세트 25분 전에 끝날까?",
    options: ["25분 전", "25분 이후"],
    fields: [],
  },
  { id: "free", sport: "자유", title: "", options: ["", ""], fields: [] },
]

const FIELD_LABEL: Record<Field, string> = {
  team: "팀",
  batter: "타자",
  teamA: "A팀",
  teamB: "B팀",
}
const DEADLINE_PRESETS = [3, 5, 10, 15]
const LIVE_DESCRIPTION =
  "판정 기준 · 공식 중계 화면 기준. 경기가 중단·취소되면 이슈를 취소하고 건 신용도를 전부 돌려드려요."

function fill(text: string, values: Record<Field, string>) {
  return text
    .replaceAll("{팀}", values.team.trim())
    .replaceAll("{타자}", values.batter.trim())
    .replaceAll("{A}", values.teamA.trim())
    .replaceAll("{B}", values.teamB.trim())
}

/** 버튼을 누른 시각 — 이벤트 핸들러에서만 부른다. */
const currentTime = () => Date.now()

/** 라이브 출제 — 경기 중 짧은 예측을 템플릿으로 바로 열고, 마감된 라이브를 선택지 버튼 하나로 판정한다. */
export default function AdminLivePage() {
  const now = useNow()
  const { data, isLoading, error } = useAllAdminIssues()
  const live = (data?.items ?? []).filter(isLiveIssue)
  const nowMs = now.getTime()
  const running = live
    .filter((i) => i.status === "OPEN" && Date.parse(i.voteDeadlineAt) > nowMs)
    .sort((a, b) => Date.parse(a.voteDeadlineAt) - Date.parse(b.voteDeadlineAt))
  const waiting = live
    .filter(
      (i) =>
        i.status !== "CONFIRMED" &&
        !(i.status === "OPEN" && Date.parse(i.voteDeadlineAt) > nowMs),
    )
    .sort((a, b) => Date.parse(a.voteDeadlineAt) - Date.parse(b.voteDeadlineAt))

  return (
    <div className="grid grid-cols-[440px_minmax(0,1fr)] items-start gap-5">
      <QuickCreate />
      <div className="flex flex-col gap-5">
        <section className="flex flex-col gap-3 rounded-3xl bg-surface p-6">
          <h2 className="text-lg font-extrabold">판정 대기 {waiting.length}</h2>
          {isLoading || error ? (
            <EmptyState
              text={error ? error.message : "불러오는 중..."}
              className="py-10"
            />
          ) : waiting.length === 0 ? (
            <EmptyState text="판정할 라이브가 없어요" className="py-10" />
          ) : (
            waiting.map((issue) => <JudgeRow key={issue.id} issue={issue} />)
          )}
        </section>
        <section className="flex flex-col gap-1 rounded-3xl bg-surface p-6">
          <h2 className="pb-2 text-lg font-extrabold">
            진행 중 {running.length}
          </h2>
          {running.length === 0 && (
            <EmptyState text="진행 중인 라이브가 없어요" className="py-10" />
          )}
          {running.map((issue) => {
            const remain = Date.parse(issue.voteDeadlineAt) - nowMs
            const pct = optionPercents(issue.options)
            return (
              <div
                key={issue.id}
                className="flex items-center gap-4 border-t border-line-3 py-3.5 first-of-type:border-t-0"
              >
                <span
                  className={cn(
                    "w-16 text-lg font-extrabold tabular-nums",
                    remain < MINUTE ? "text-danger-ink" : "text-ink",
                  )}
                >
                  {clockLabel(remain)}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-[15px] font-bold">
                    {issue.title}
                  </span>
                  <span className="truncate text-xs text-muted tabular-nums">
                    {issue.options
                      .map((o) => `${o.text} ${pct[o.id]}%`)
                      .join(" · ")}
                  </span>
                </div>
              </div>
            )
          })}
        </section>
      </div>
    </div>
  )
}

function QuickCreate() {
  const showToast = useToast()
  const create = useCreateAdminIssue()
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id)
  const [values, setValues] = useState<Record<Field, string>>({
    team: "",
    batter: "",
    teamA: "",
    teamB: "",
  })
  const [freeTitle, setFreeTitle] = useState("")
  const [freeOptions, setFreeOptions] = useState(["", ""])
  const [minutes, setMinutes] = useState(5)

  const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0]
  const isFree = template.id === "free"
  const title = isFree ? freeTitle.trim() : fill(template.title, values)
  const options = (
    isFree ? freeOptions : template.options.map((o) => fill(o, values))
  ).map((o) => o.trim())
  const filled = template.fields.every((f) => values[f].trim())
  const valid =
    title.length > 0 &&
    filled &&
    options.length >= 2 &&
    options.every(Boolean) &&
    new Set(options).size === options.length

  function open() {
    if (!valid || create.isPending) return
    const start = currentTime()
    create.mutate(
      {
        title,
        description: LIVE_DESCRIPTION,
        voteStartAt: toDateTimeLocal(start),
        voteDeadlineAt: toDateTimeLocal(start + minutes * MINUTE),
        options,
      },
      {
        onSuccess: () => showToast(`라이브를 열었어요 · ${minutes}분 뒤 마감`),
        onError: (e) => showToast(e.message),
      },
    )
  }

  const input =
    "h-11 rounded-xl border-[1.5px] border-line-2 bg-surface px-3.5 text-sm outline-none focus:border-brand"

  return (
    <section className="sticky top-7 flex flex-col gap-5 rounded-3xl bg-surface p-6">
      <h2 className="flex items-center gap-2 text-lg font-extrabold">
        <Radio className="size-5 text-danger-ink" />
        빠른 출제
      </h2>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-sub">템플릿</span>
        {(["야구", "롤", "자유"] as const).map((sport) => (
          <div key={sport} className="flex flex-wrap gap-1.5">
            {TEMPLATES.filter((t) => t.sport === sport).map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={t.id === templateId}
                onClick={() => setTemplateId(t.id)}
                className={cn(
                  "rounded-[10px] px-3 py-2 text-left text-[13px] font-bold",
                  t.id === templateId
                    ? "bg-ink text-white"
                    : "bg-track text-sub",
                )}
              >
                <span className="pr-1.5 opacity-60">{t.sport}</span>
                {t.id === "free"
                  ? "직접 입력"
                  : t.title.replace(/\{.+?\}/g, "○○")}
              </button>
            ))}
          </div>
        ))}
      </div>

      {template.fields.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {template.fields.map((f) => (
            <label key={f} className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-sub">
                {FIELD_LABEL[f]}
              </span>
              <input
                value={values[f]}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f]: e.target.value }))
                }
                placeholder={f === "batter" ? "예: 김도영" : "예: KIA"}
                className={input}
              />
            </label>
          ))}
        </div>
      )}

      {isFree && (
        <div className="flex flex-col gap-2">
          <input
            value={freeTitle}
            onChange={(e) => setFreeTitle(e.target.value)}
            placeholder="제목"
            className={input}
          />
          {freeOptions.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={o}
                onChange={(e) =>
                  setFreeOptions((list) =>
                    list.map((x, k) => (k === i ? e.target.value : x)),
                  )
                }
                placeholder={`선택지 ${i + 1}`}
                className={cn(input, "flex-1")}
              />
              {freeOptions.length > 2 && (
                <button
                  type="button"
                  aria-label="선택지 삭제"
                  onClick={() =>
                    setFreeOptions((list) => list.filter((_, k) => k !== i))
                  }
                >
                  <CircleMinus className="size-5 text-muted" />
                </button>
              )}
            </div>
          ))}
          {freeOptions.length < 6 && (
            <button
              type="button"
              onClick={() => setFreeOptions((list) => [...list, ""])}
              className="flex items-center gap-1.5 self-start text-[13px] font-bold text-brand"
            >
              <CirclePlus className="size-4" />
              선택지 추가
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-sub">마감</span>
        <div className="grid grid-cols-4 gap-1.5">
          {DEADLINE_PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={m === minutes}
              onClick={() => setMinutes(m)}
              className={cn(
                "h-10 rounded-xl text-sm font-bold tabular-nums",
                m === minutes ? "bg-ink text-white" : "bg-track",
              )}
            >
              +{m}분
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 rounded-2xl bg-track p-4">
        <span className="text-xs font-semibold text-muted">미리보기</span>
        <span className="text-[15px] font-bold">
          {title || "제목을 채워주세요"}
        </span>
        <span className="text-[13px] text-sub">
          {options.map((o) => o || "○○").join(" / ")}
        </span>
      </div>

      <button
        type="button"
        onClick={open}
        disabled={!valid || create.isPending}
        className="h-[52px] rounded-[14px] bg-brand text-[15px] font-bold text-white disabled:bg-disabled-bg disabled:text-muted"
      >
        바로 열기
      </button>
    </section>
  )
}

function JudgeRow({ issue }: { issue: AdminIssueListItem }) {
  const { askGeneric, askDelete } = useAdminUI()
  const showToast = useToast()
  const confirm = useConfirmAdminIssue()
  const pct = optionPercents(issue.options)

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border-[1.5px] border-line-2 p-4">
      <div className="flex items-start gap-3">
        <span className="flex-1 text-[15px] font-bold">{issue.title}</span>
        <ActionButton
          Icon={Trash2}
          label="취소(전액 환불)"
          tone="danger"
          onClick={() => askDelete(issue)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {issue.options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() =>
              askGeneric({
                title: `'${o.text}'(으)로 확정할까요?`,
                description: `"${issue.title}"의 정답을 확정하고 바로 정산해요. 확정 후에는 되돌리기 어려워요.`,
                okLabel: "확정",
                danger: false,
                onOk: () =>
                  confirm
                    .mutateAsync({ issueId: issue.id, correctOptionId: o.id })
                    .then(() => showToast("결과를 확정했어요")),
              })
            }
            className="flex h-10 items-center gap-1.5 rounded-xl bg-ink px-3.5 text-[13px] font-bold text-white"
          >
            <BadgeCheck className="size-4" />
            {o.text}{" "}
            <span className="tabular-nums opacity-60">{pct[o.id]}%</span> ·
            이걸로 확정
          </button>
        ))}
      </div>
    </div>
  )
}
