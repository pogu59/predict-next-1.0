import type { BackendIssueStatus } from "@/lib/api"

/** lib/tier.ts와 동일한 패턴 — 서버는 IssueStatus enum을 이름 그대로 내려주므로 라벨은 프론트에서 매핑한다. */
export const TOPIC_STATUS_LABELS: Record<BackendIssueStatus, string> = {
  OPEN: "진행중",
  PENDING_RESULT: "결과대기",
  CONFIRMED: "확정",
}

export function issueStatusLabel(status: BackendIssueStatus) {
  return TOPIC_STATUS_LABELS[status] ?? status
}
