"use client"

import Link from "next/link"
import { useState } from "react"

import { ChevronRight, Trophy, Users } from "lucide-react"

import type { CrewRankingItem } from "@/lib/api"
import { DAY, formatDate, useNow } from "@/lib/issues"
import { useMe } from "@/lib/queries/auth"
import {
  useCrewRanking,
  useCrewTopMembers,
  useMyCrew,
} from "@/lib/queries/crew"
import { TierIcon } from "@/lib/tier"
import { cn } from "@/lib/utils"
import { CrewPicker, CrewSheet, signedScore } from "@/components/crew-picker"

const pad = (n: number) => String(n).padStart(2, "0")

/** 이번 주 마감(다음 월요일 00:00, 기기 시각 기준)까지 남은 시간 — "2일 03:12 남음". */
function weekRemainLabel(now: Date) {
  const daysToMonday = (8 - now.getDay()) % 7 || 7
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + daysToMonday,
  )
  const ms = end.getTime() - now.getTime()
  const days = Math.floor(ms / DAY)
  const minutes = Math.floor((ms % DAY) / 60_000)
  return `${days > 0 ? `${days}일 ` : ""}${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)} 남음`
}

/** 지난주 아무 날짜 "YYYY-MM-DD" — 서버가 그 주 월요일로 맞춘다. */
function lastWeekParam(now: Date) {
  const d = new Date(now.getTime() - 7 * DAY)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const RULES = [
  "인원 합계가 아니라 인원당 점수라 작은 크루도 이길 수 있어요",
  "이번 주에 3번 이상 결과가 나온 예측이 있어야 활성 멤버로 집계돼요",
  "크루는 30일마다 바꿀 수 있어요",
]

/** 크루 대항전 — 이번 주(또는 지난주) 크루별 인원당 점수 순위와 내 크루. */
export default function CrewPage() {
  const now = useNow()
  const [lastWeek, setLastWeek] = useState(false)
  const week = lastWeek ? lastWeekParam(now) : undefined
  const { data: me } = useMe()
  const { data: mine } = useMyCrew(me?.userId)
  const { data: ranking = [], isLoading, error } = useCrewRanking(week)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [detail, setDetail] = useState<CrewRankingItem | null>(null)

  const myCrewId = mine?.crew?.id ?? null
  const ranked = ranking.filter((r) => r.rank != null)
  const pending = ranking.filter((r) => r.rank == null)

  return (
    <div className="pb-10 lg:pb-0">
      <div className="flex flex-col gap-1 px-5 pt-2 pb-4 lg:px-0 lg:pt-0 lg:pb-[18px]">
        <h1 className="text-2xl font-extrabold tracking-[-0.04em] lg:text-[30px]">
          이번 주 크루 대항전
        </h1>
        <span className="text-sm font-semibold text-sub tabular-nums">
          일요일 24시 마감 · {weekRemainLabel(now)}
        </span>
      </div>

      <div className="flex flex-col gap-4 px-4 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-7 lg:px-0">
        <section className="flex flex-col rounded-3xl bg-surface p-5 lg:order-1">
          <div className="flex items-center justify-between pb-3">
            <h2 className="flex items-center gap-2 text-base font-extrabold">
              <Trophy className="size-[18px] text-brand" />
              순위
            </h2>
            <div className="flex gap-1 rounded-xl bg-track p-1">
              {[
                { label: "이번 주", value: false },
                { label: "지난주", value: true },
              ].map((t) => (
                <button
                  key={t.label}
                  type="button"
                  aria-pressed={lastWeek === t.value}
                  onClick={() => setLastWeek(t.value)}
                  className={cn(
                    "rounded-[9px] px-3 py-1.5 text-[13px] font-bold",
                    lastWeek === t.value
                      ? "bg-surface text-ink shadow-card"
                      : "text-sub",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading || error ? (
            <span className="py-12 text-center text-sm text-faint">
              {error ? error.message : "불러오는 중..."}
            </span>
          ) : ranking.length === 0 ? (
            <span className="py-12 text-center text-sm text-faint">
              아직 열린 크루가 없어요
            </span>
          ) : (
            <>
              {ranked.map((r) => (
                <RankRow
                  key={r.crewId}
                  item={r}
                  mine={r.crewId === myCrewId}
                  onOpen={() => setDetail(r)}
                />
              ))}
              {pending.length > 0 && (
                <>
                  <span className="pt-4 pb-1 text-xs font-semibold text-muted">
                    집계 중 · 활성 멤버 5명부터 순위에 들어가요
                  </span>
                  {pending.map((r) => (
                    <RankRow
                      key={r.crewId}
                      item={r}
                      mine={r.crewId === myCrewId}
                      onOpen={() => setDetail(r)}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </section>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-[92px]">
          <MyCrewCard
            loggedIn={!!me}
            mine={mine}
            item={ranking.find((r) => r.crewId === myCrewId)}
            lastWeek={lastWeek}
            now={now}
            onPick={() => setPickerOpen(true)}
          />
          <section className="flex flex-col gap-2.5 rounded-3xl bg-surface p-5">
            <span className="text-base font-extrabold">규칙</span>
            {RULES.map((rule) => (
              <span
                key={rule}
                className="flex gap-2 text-[13px] leading-[1.6] text-sub"
              >
                <span className="mt-[9px] size-1 flex-none rounded-full bg-muted" />
                {rule}
              </span>
            ))}
          </section>
        </aside>
      </div>

      <CrewPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        currentCrewId={myCrewId}
      />
      <TopMembersSheet
        item={detail}
        week={week}
        onClose={() => setDetail(null)}
      />
    </div>
  )
}

function RankRow({
  item,
  mine,
  onOpen,
}: {
  item: CrewRankingItem
  mine: boolean
  onOpen: () => void
}) {
  const podium = item.rank != null && item.rank <= 3
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-bg",
        mine && "bg-brand-soft hover:bg-brand-soft",
        item.rank == null && "text-muted",
      )}
    >
      <span
        className={cn(
          "grid size-8 flex-none place-items-center rounded-full text-sm font-extrabold tabular-nums",
          podium ? "bg-brand text-white" : "text-sub",
        )}
      >
        {item.rank ?? "-"}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            "truncate text-[15px]",
            podium ? "font-extrabold" : "font-bold",
          )}
        >
          {item.name}
          {mine && (
            <span className="pl-1.5 text-xs font-bold text-brand">내 크루</span>
          )}
        </span>
        <span className="flex items-center gap-1 text-xs font-semibold text-muted tabular-nums">
          <Users className="size-3" />
          활성 {item.activeMembers}명 · 전체 {item.memberCount}명
        </span>
      </div>
      <span
        className={cn(
          "text-right font-extrabold tabular-nums",
          podium ? "text-lg" : "text-base",
          item.rank != null && "text-ink",
        )}
      >
        {signedScore(item.scorePerMember)}
        <span className="block text-[11px] font-semibold text-muted">
          인원당
        </span>
      </span>
    </button>
  )
}

function MyCrewCard({
  loggedIn,
  mine,
  item,
  lastWeek,
  now,
  onPick,
}: {
  loggedIn: boolean
  mine: ReturnType<typeof useMyCrew>["data"]
  item: CrewRankingItem | undefined
  lastWeek: boolean
  now: Date
  onPick: () => void
}) {
  if (!loggedIn) {
    return (
      <section className="flex flex-col items-start gap-2 rounded-3xl bg-surface p-5">
        <span className="text-base font-extrabold">
          크루를 고르고 대항전에 참여하세요
        </span>
        <Link
          href="/login"
          className="mt-1 rounded-[13px] bg-ink px-4 py-3 text-sm font-bold text-white"
        >
          로그인하기
        </Link>
      </section>
    )
  }
  if (!mine?.crew) {
    return (
      <section className="flex flex-col items-start gap-2 rounded-3xl bg-surface p-5">
        <span className="text-base font-extrabold">
          크루를 고르고 대항전에 참여하세요
        </span>
        <span className="text-[13px] leading-[1.6] text-sub">
          학교·팬덤·커뮤니티 단위로 모여 매주 인원당 점수로 겨뤄요.
        </span>
        <button
          type="button"
          onClick={onPick}
          className="mt-1 rounded-[13px] bg-brand px-4 py-3 text-sm font-bold text-white"
        >
          크루 고르기
        </button>
      </section>
    )
  }
  const canChange =
    mine.nextChangeAt != null && Date.parse(mine.nextChangeAt) <= now.getTime()
  const active = mine.weekSettlements >= 3
  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-brand p-5 text-white">
      <span className="text-[13px] font-semibold opacity-75">내 크루</span>
      <span className="text-2xl font-extrabold tracking-[-0.03em]">
        {mine.crew.name}
      </span>
      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white/12 p-3 text-center">
        <div className="flex flex-col gap-0.5">
          <span className="text-lg font-extrabold tabular-nums">
            {item?.rank ?? "-"}
          </span>
          <span className="text-[11px] font-semibold opacity-75">
            {lastWeek ? "지난주 순위" : "순위"}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-lg font-extrabold tabular-nums">
            {item ? signedScore(item.scorePerMember) : "-"}
          </span>
          <span className="text-[11px] font-semibold opacity-75">인원당</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-lg font-extrabold tabular-nums">
            {signedScore(mine.weekScoreGain)}
          </span>
          <span className="text-[11px] font-semibold opacity-75">
            이번 주 내 기여
          </span>
        </div>
      </div>
      <span className="text-xs font-semibold tabular-nums opacity-80">
        이번 주 결과 {mine.weekSettlements}건 ·{" "}
        {active ? "활성 멤버로 집계 중" : "3건부터 활성 멤버"}
      </span>
      {canChange ? (
        <button
          type="button"
          onClick={onPick}
          className="flex items-center gap-0.5 self-start text-[13px] font-bold"
        >
          크루 바꾸기
          <ChevronRight className="size-4" />
        </button>
      ) : (
        mine.nextChangeAt && (
          <span className="text-xs opacity-70">
            {formatDate(mine.nextChangeAt)}부터 바꿀 수 있어요
          </span>
        )
      )}
    </section>
  )
}

function TopMembersSheet({
  item,
  week,
  onClose,
}: {
  item: CrewRankingItem | null
  week: string | undefined
  onClose: () => void
}) {
  const { data: members = [], isLoading } = useCrewTopMembers(
    item?.crewId,
    week,
  )
  return (
    <CrewSheet
      open={item != null}
      onOpenChange={(open) => !open && onClose()}
      title={
        item ? `${item.name} · ${week ? "지난주" : "이번 주"} 상위 멤버` : ""
      }
    >
      <div className="flex flex-col">
        {isLoading && (
          <span className="py-8 text-center text-sm text-faint">
            불러오는 중...
          </span>
        )}
        {!isLoading && members.length === 0 && (
          <span className="py-8 text-center text-sm text-faint">
            아직 결과가 나온 예측이 없어요
          </span>
        )}
        {members.map((m, i) => (
          <div
            key={`${m.nickname}-${i}`}
            className="flex items-center gap-3 border-t border-line-3 px-1 py-3 first:border-t-0"
          >
            <span className="w-5 text-center text-sm font-extrabold text-brand tabular-nums">
              {i + 1}
            </span>
            <TierIcon tier={m.tier} size={20} />
            <span className="flex-1 truncate text-[15px] font-bold">
              {m.nickname}
            </span>
            <span className="text-[15px] font-extrabold tabular-nums">
              {signedScore(m.scoreGain)}
            </span>
          </div>
        ))}
      </div>
    </CrewSheet>
  )
}
