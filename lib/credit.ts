import { useMe } from "@/lib/queries/auth"
import { useMyVotes } from "@/lib/queries/user"
import { tierLabel, tierProgress } from "@/lib/tier"

/**
 * 신용도 카드에 필요한 값. 보유(credibilityScore)는 베팅 즉시 에스크로로 빠진 값이라,
 * 아직 정산되지 않은 투표의 스테이크를 더한 총액으로 티어 진행바를 그린다.
 */
export function useCredit() {
  const { data: me } = useMe()
  const { data: votes = [] } = useMyVotes(me?.userId)
  const credit = me?.credibilityScore ?? 0
  const escrow = votes.filter((v) => v.status !== "CONFIRMED").reduce((sum, v) => sum + v.stake, 0)
  const total = credit + escrow
  const progress = tierProgress(total)
  const nextLabel =
    `예측에 걸린 ${escrow.toLocaleString()} 포함 ${total.toLocaleString()}` +
    (progress.nextTier ? ` · ${tierLabel(progress.nextTier)}까지 ${progress.remaining.toLocaleString()}` : "")
  return { me, votes, credit, escrow, total, progress, nextLabel }
}
