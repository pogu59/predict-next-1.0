"use client"

import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"

import { TierIcon } from "@/lib/tier"
import { IssueCardMobile } from "@/components/issue-card"
import {
  FilterChips,
  IssuesPc,
  parseIssueFilter,
  sortForFilter,
  useIssueBuckets,
  type IssueFilter,
} from "@/components/issue-feed"

/** 예측 목록(홈 → 전체 보기). 필터는 ?filter=open|soon|result 로 유지한다. */
function IssueList() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const filter = parseIssueFilter(searchParams.get("filter"))
  const { now, me, buckets, deltaByIssue, isLoading, error } = useIssueBuckets()

  const setFilter = (next: IssueFilter) => router.replace(`${pathname}?filter=${next}`, { scroll: false })

  function goBack() {
    if (window.history.length > 1) router.back()
    else router.push("/")
  }

  const feed = sortForFilter(buckets[filter], filter)
  const counts = { open: buckets.open.length, soon: buckets.soon.length, result: buckets.result.length }
  const status = error ? error.message : isLoading ? "불러오는 중..." : "해당하는 이슈가 없어요"

  return (
    <>
      {/* 모바일 */}
      <div className="pb-[100px] lg:hidden">
        <div className="flex items-center justify-between pt-2 pr-4 pb-3.5 pl-2">
          <span className="flex items-center gap-0.5">
            <button type="button" onClick={goBack} className="p-2" aria-label="뒤로">
              <ChevronLeft className="size-6" />
            </button>
            <h1 className="text-[22px] font-extrabold tracking-[-0.04em]">예측</h1>
          </span>
          {me ? (
            <Link
              href="/my"
              className="flex items-center gap-1.5 rounded-full bg-surface py-1.5 pr-3 pl-[7px] shadow-[0_1px_2px_rgba(0,0,0,.05)]"
            >
              <TierIcon tier={me.tier} size={20} />
              <span className="text-sm font-bold tabular-nums">{me.credibilityScore.toLocaleString()}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-surface px-3 py-1.5 text-sm font-bold shadow-[0_1px_2px_rgba(0,0,0,.05)]"
            >
              로그인
            </Link>
          )}
        </div>
        <div className="flex gap-1.5 px-5 pb-3.5">
          <FilterChips filter={filter} onChange={setFilter} counts={counts} size="mobile" />
        </div>
        <div className="flex flex-col gap-2.5 px-4">
          {feed.map((issue) => (
            <IssueCardMobile key={issue.id} issue={issue} now={now} scoreDelta={deltaByIssue[issue.id]} />
          ))}
          {feed.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-[60px]">
              <span className="text-sm text-faint">{status}</span>
              {filter === "open" && !isLoading && !error && (
                <Link href="/rewind" className="rounded-[13px] bg-ink px-4 py-3 text-sm font-bold text-white">
                  지난 예측 다시 풀기
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      <IssuesPc filter={filter} onFilter={setFilter} />
    </>
  )
}

export default function IssueListPage() {
  return (
    <Suspense>
      <IssueList />
    </Suspense>
  )
}
