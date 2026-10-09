"use client"

import { useState } from "react"

import { CircleCheck, Info, Send, TriangleAlert, Undo2 } from "lucide-react"

import type { AdminExchange } from "@/lib/api"
import { DAY, formatDateTime, HOUR, useNow } from "@/lib/issues"
import { EXCHANGE_STATUS, formatPoints } from "@/lib/mission"
import {
  useAdminExchanges,
  useRejectAdminExchange,
  useSendAdminExchange,
} from "@/lib/queries/admin"
import { cn } from "@/lib/utils"
import { useAdminUI } from "@/components/admin/admin-ui"
import { EmptyState, SegTabs } from "@/components/admin/parts"
import { ProductIcon } from "@/components/mission-parts"
import { useToast } from "@/components/ui/toast"

type Filter = "REQUESTED" | "SENT" | "REJECTED"

/** 반려율이 이 값을 넘으면 "확인할 점"으로 표시한다(기획서 부정 참여 기준 v0). */
const REJECT_RATE_LIMIT = 10

const REJECT_REASONS = [
  "부정 참여 의심",
  "상품 일시 품절",
  "중복 계정 의심",
  "기타",
] as const

function waitLabel(createdAt: string, now: Date) {
  const ms = now.getTime() - Date.parse(createdAt)
  if (ms < HOUR) return `${Math.max(1, Math.floor(ms / 60_000))}분`
  return `${Math.floor(ms / HOUR)}시간`
}

/** 신청자의 미션 기록으로 본 참고 신호. 판단은 운영자가 한다. */
function signals(e: AdminExchange) {
  const judged = e.approvedSubmissions + e.rejectedSubmissions
  const rate =
    judged > 0 ? Math.round((e.rejectedSubmissions / judged) * 100) : 0
  const out: { text: string; warn: boolean }[] = []
  if (rate > REJECT_RATE_LIMIT) out.push({ text: `반려 ${rate}%`, warn: true })
  if (e.approvedSubmissions < 3)
    out.push({ text: `통과 미션 ${e.approvedSubmissions}건`, warn: true })
  return { rate, judged, out }
}

export default function AdminExchangesPage() {
  const now = useNow(60_000)
  const [filter, setFilter] = useState<Filter>("REQUESTED")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const requested = useAdminExchanges("REQUESTED")
  const sent = useAdminExchanges("SENT")
  const rejected = useAdminExchanges("REJECTED")
  const current =
    filter === "REQUESTED" ? requested : filter === "SENT" ? sent : rejected
  const rows = current.data ?? []
  const selected = rows.find((r) => r.id === selectedId) ?? rows[0]

  const pending = requested.data ?? []
  const pendingPoints = pending.reduce((sum, e) => sum + e.points, 0)
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime()
  const sentToday = (sent.data ?? []).filter(
    (e) => e.handledAt && Date.parse(e.handledAt) >= startOfToday,
  ).length
  const rejectedWeek = (rejected.data ?? []).filter(
    (e) => e.handledAt && now.getTime() - Date.parse(e.handledAt) < 7 * DAY,
  ).length

  return (
    <>
      <div className="flex flex-wrap gap-2.5">
        {[
          {
            label: "확인 대기",
            value: `${pending.length}건 · ${formatPoints(pendingPoints)}`,
          },
          { label: "오늘 발송 완료", value: `${sentToday}건` },
          { label: "최근 7일 반려", value: `${rejectedWeek}건` },
        ].map((s) => (
          <div
            key={s.label}
            className="flex min-w-[180px] flex-col gap-1 rounded-[18px] bg-surface px-[18px] py-4"
          >
            <span className="text-[13px] font-semibold text-sub">
              {s.label}
            </span>
            <span className="text-[22px] font-extrabold tabular-nums">
              {s.value}
            </span>
          </div>
        ))}
      </div>

      <SegTabs
        className="self-start"
        tabs={[
          { key: "REQUESTED", label: "확인 대기", count: pending.length },
          { key: "SENT", label: "발송 완료", count: sent.data?.length ?? 0 },
          { key: "REJECTED", label: "반려", count: rejected.data?.length ?? 0 },
        ]}
        value={filter}
        onChange={(key) => {
          setFilter(key)
          setSelectedId(null)
        }}
      />

      {rows.length === 0 ? (
        <EmptyState
          text={
            current.error
              ? current.error.message
              : current.isLoading
                ? "불러오는 중..."
                : filter === "REQUESTED"
                  ? "확인할 교환 신청이 없어요"
                  : "아직 기록이 없어요"
          }
        />
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-4">
          <section
            aria-label="교환 신청 목록"
            className="overflow-x-auto rounded-[22px] bg-surface"
          >
            <table className="w-full min-w-[620px] border-collapse text-sm tabular-nums">
              <thead>
                <tr className="text-left text-xs font-bold text-sub">
                  <th scope="col" className="px-[18px] pt-4 pb-2.5 font-bold">
                    신청 시각
                  </th>
                  <th scope="col" className="px-2.5 pt-4 pb-2.5 font-bold">
                    닉네임
                  </th>
                  <th scope="col" className="px-2.5 pt-4 pb-2.5 font-bold">
                    상품
                  </th>
                  <th
                    scope="col"
                    className="px-2.5 pt-4 pb-2.5 text-right font-bold"
                  >
                    포인트
                  </th>
                  <th scope="col" className="px-2.5 pt-4 pb-2.5 font-bold">
                    {filter === "REQUESTED" ? "대기" : "처리"}
                  </th>
                  <th scope="col" className="px-[18px] pt-4 pb-2.5 font-bold">
                    확인할 점
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => {
                  const on = selected?.id === e.id
                  const late = now.getTime() - Date.parse(e.createdAt) >= DAY
                  const { out } = signals(e)
                  return (
                    <tr
                      key={e.id}
                      onClick={() => setSelectedId(e.id)}
                      className={cn(
                        "cursor-pointer border-t border-line-3",
                        on
                          ? "bg-brand-soft shadow-[inset_3px_0_0_var(--color-brand)]"
                          : "hover:bg-bg",
                      )}
                    >
                      <td className="px-[18px] py-3.5 font-semibold">
                        <button
                          type="button"
                          onClick={() => setSelectedId(e.id)}
                          aria-pressed={on}
                          className="text-left"
                        >
                          {formatDateTime(e.createdAt)}
                        </button>
                      </td>
                      <td className="px-2.5 py-3.5 font-bold">{e.nickname}</td>
                      <td className="px-2.5 py-3.5">{e.productName}</td>
                      <td className="px-2.5 py-3.5 text-right font-bold">
                        {formatPoints(e.points)}
                      </td>
                      <td className="px-2.5 py-3.5">
                        {filter === "REQUESTED" ? (
                          late ? (
                            <span className="rounded-lg bg-danger-soft px-2 py-[3px] text-xs font-bold text-danger-ink">
                              {waitLabel(e.createdAt, now)}
                            </span>
                          ) : (
                            <span className="text-ink-2">
                              {waitLabel(e.createdAt, now)}
                            </span>
                          )
                        ) : (
                          <span className="text-ink-2">
                            {e.handledAt ? formatDateTime(e.handledAt) : "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-[18px] py-3.5">
                        {out.length === 0 ? (
                          <span className="text-sub">없음</span>
                        ) : (
                          <span className="flex flex-wrap gap-1">
                            {out.map((s) => (
                              <span
                                key={s.text}
                                className="rounded-lg bg-warn-soft px-2 py-[3px] text-xs font-bold text-warn-ink"
                              >
                                {s.text}
                              </span>
                            ))}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
          {selected && <ExchangeDetail key={selected.id} exchange={selected} />}
        </div>
      )}
    </>
  )
}

function ExchangeDetail({ exchange: e }: { exchange: AdminExchange }) {
  const ui = useAdminUI()
  const showToast = useToast()
  const send = useSendAdminExchange()
  const reject = useRejectAdminExchange()
  const [reason, setReason] = useState<(typeof REJECT_REASONS)[number]>(
    REJECT_REASONS[0],
  )
  const [etc, setEtc] = useState("")
  const chip = EXCHANGE_STATUS[e.status]
  const { rate, judged } = signals(e)
  const finalReason = reason === "기타" ? etc.trim() : reason

  const checks = [
    {
      ok: rate <= REJECT_RATE_LIMIT,
      text:
        judged > 0
          ? `반려된 제출 ${rate}% (기준 ${REJECT_RATE_LIMIT}% 이하)`
          : "검수된 제출이 아직 없어요",
    },
    {
      ok: e.approvedSubmissions >= 3,
      text: `통과한 미션 ${e.approvedSubmissions.toLocaleString()}건`,
    },
  ]

  return (
    <section
      aria-label="선택한 신청 상세"
      className="sticky top-7 flex flex-col gap-4 rounded-[22px] bg-surface p-[22px]"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-extrabold">신청 상세</h2>
        <span
          className={cn(
            "rounded-[10px] px-[9px] py-1 text-xs font-extrabold",
            chip.className,
          )}
        >
          {chip.label}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="grid size-11 flex-none place-items-center rounded-[14px] bg-warn-soft text-warn-ink">
          <ProductIcon code={e.productCode} className="size-[22px]" />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-[15px] font-bold">{e.productName}</span>
          <span className="text-[13px] font-semibold text-sub tabular-nums">
            {formatPoints(e.points)}
          </span>
        </span>
      </div>
      <dl className="grid grid-cols-[76px_1fr] gap-x-3 gap-y-2.5 text-sm tabular-nums">
        <dt className="font-semibold text-sub">신청자</dt>
        <dd className="font-bold">
          {e.nickname}{" "}
          <span className="font-medium text-muted">#{e.userId}</span>
        </dd>
        <dt className="font-semibold text-sub">신청 시각</dt>
        <dd className="font-semibold">{formatDateTime(e.createdAt)}</dd>
        <dt className="font-semibold text-sub">미션 기록</dt>
        <dd className="font-semibold">
          통과 {e.approvedSubmissions.toLocaleString()} · 반려{" "}
          {e.rejectedSubmissions.toLocaleString()}
        </dd>
        {e.status !== "REQUESTED" && (
          <>
            <dt className="font-semibold text-sub">처리</dt>
            <dd className="font-semibold">
              {e.handledByNickname ?? "—"} ·{" "}
              {e.handledAt ? formatDateTime(e.handledAt) : "—"}
            </dd>
          </>
        )}
        {e.rejectReason && (
          <>
            <dt className="font-semibold text-sub">반려 사유</dt>
            <dd className="font-semibold">{e.rejectReason}</dd>
          </>
        )}
      </dl>
      <ul className="flex flex-col gap-2 rounded-[14px] bg-bg p-3.5 text-[13px] font-semibold text-ink-2">
        {checks.map((c) => (
          <li key={c.text} className="flex items-center gap-2">
            {c.ok ? (
              <CircleCheck className="size-4 flex-none text-success-ink" />
            ) : (
              <TriangleAlert className="size-4 flex-none text-warn-ink" />
            )}
            {c.text}
          </li>
        ))}
      </ul>

      {e.status === "REQUESTED" && (
        <>
          <p className="flex gap-1.5 text-xs leading-normal text-sub">
            <Info className="mt-px size-3.5 flex-none" />
            받는 번호(본인인증)는 아직 앱에 저장되지 않아요. 연동 전까지는 발송
            전에 연락처를 따로 확인해 주세요.
          </p>
          <button
            type="button"
            onClick={() =>
              ui.askGeneric({
                title: "발송 완료로 바꿀까요?",
                description: `${e.nickname}님에게 기프티콘(${e.productName})을 보낸 뒤에만 눌러 주세요. 바꾼 뒤에는 반려할 수 없어요.`,
                okLabel: "발송 완료",
                danger: false,
                onOk: async () => {
                  await send.mutateAsync(e.id)
                  showToast("발송 완료로 바꿨어요")
                },
              })
            }
            className="flex h-[50px] items-center justify-center gap-1.5 rounded-[14px] bg-brand text-[15px] font-bold text-white hover:bg-brand-hover"
          >
            <Send className="size-[17px]" />
            기프티콘 보냈어요 · 발송 완료
          </button>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="reject-reason"
              className="text-[13px] font-bold text-sub"
            >
              반려 사유
            </label>
            <div className="flex gap-2">
              <select
                id="reject-reason"
                value={reason}
                onChange={(ev) =>
                  setReason(ev.target.value as (typeof REJECT_REASONS)[number])
                }
                className="h-[46px] min-w-0 flex-1 rounded-xl border-[1.5px] border-line-2 bg-bg px-3 text-sm font-semibold text-ink outline-none"
              >
                {REJECT_REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={!finalReason}
                onClick={() =>
                  ui.askGeneric({
                    title: "교환 신청을 반려할까요?",
                    description: `반려 사유(${finalReason})는 참여자 지갑에 그대로 보여요. ${formatPoints(e.points)}는 바로 환불돼요.`,
                    okLabel: "반려",
                    onOk: async () => {
                      await reject.mutateAsync({
                        exchangeId: e.id,
                        reason: finalReason,
                      })
                      showToast("반려하고 포인트를 돌려줬어요")
                    },
                  })
                }
                className="flex h-[46px] flex-none items-center gap-1 rounded-xl bg-danger-soft px-4 text-sm font-extrabold text-danger-ink disabled:opacity-50"
              >
                <Undo2 className="size-4" />
                반려하기
              </button>
            </div>
            {reason === "기타" && (
              <input
                value={etc}
                onChange={(ev) => setEtc(ev.target.value)}
                maxLength={200}
                placeholder="참여자에게 보여 줄 사유를 적어 주세요"
                aria-label="기타 반려 사유"
                className="h-[46px] rounded-xl border-[1.5px] border-line-2 px-3 text-sm outline-none"
              />
            )}
            <span className="text-xs font-medium text-sub">
              반려하면 {formatPoints(e.points)}가 환불 기록과 함께 바로
              돌아가요.
            </span>
          </div>
        </>
      )}
    </section>
  )
}
