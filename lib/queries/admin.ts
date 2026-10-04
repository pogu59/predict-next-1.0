import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  Api,
  type AdminIssueListParams,
  type AdminUserListParams,
  type BackendRole,
  type CommunityContentType,
  type IssueUpsertPayload,
} from "@/lib/api"
import { queryKeys } from "./keys"

// ---- 관리자: 이슈 ----

export function useAdminIssues(params: AdminIssueListParams) {
  return useQuery({
    queryKey: queryKeys.adminIssues(params),
    queryFn: () => Api().admin.issue.list(params),
  })
}

export function useAdminIssue(issueId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.adminIssue(issueId ?? 0),
    queryFn: () => Api().admin.issue.get(issueId as number),
    enabled: issueId !== undefined,
  })
}

/** 관리자 변경은 사용자 화면(이슈 목록/상세, 내 투표)에도 바로 반영돼야 해서 함께 무효화한다. */
function useInvalidateIssues() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "issues"] })
    queryClient.invalidateQueries({ queryKey: ["admin", "issue"] })
    queryClient.invalidateQueries({ queryKey: ["issues"] })
    queryClient.invalidateQueries({ queryKey: ["issue"] })
    queryClient.invalidateQueries({ queryKey: ["myVotes"] })
    queryClient.invalidateQueries({ queryKey: queryKeys.me })
  }
}

export function useCreateAdminIssue() {
  const invalidate = useInvalidateIssues()
  return useMutation({
    mutationFn: (payload: IssueUpsertPayload) => Api().admin.issue.create(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateAdminIssue() {
  const invalidate = useInvalidateIssues()
  return useMutation({
    mutationFn: ({ issueId, payload }: { issueId: number; payload: IssueUpsertPayload }) =>
      Api().admin.issue.update(issueId, payload),
    onSuccess: invalidate,
  })
}

export function useExtendAdminIssueDeadline() {
  const invalidate = useInvalidateIssues()
  return useMutation({
    mutationFn: ({ issueId, newDeadline }: { issueId: number; newDeadline: string }) =>
      Api().admin.issue.extendDeadline(issueId, newDeadline),
    onSuccess: invalidate,
  })
}

export function useConfirmAdminIssue() {
  const invalidate = useInvalidateIssues()
  return useMutation({
    mutationFn: ({ issueId, correctOptionId }: { issueId: number; correctOptionId: number }) =>
      Api().admin.issue.confirm(issueId, correctOptionId),
    onSuccess: invalidate,
  })
}

export function useDeleteAdminIssue() {
  const invalidate = useInvalidateIssues()
  return useMutation({
    mutationFn: (issueId: number) => Api().admin.issue.delete(issueId),
    onSuccess: invalidate,
  })
}

// ---- 관리자: 유저 ----

export function useAdminUsers(params: AdminUserListParams) {
  return useQuery({
    queryKey: queryKeys.adminUsers(params),
    queryFn: () => Api().admin.user.list(params),
  })
}

function useInvalidateUsers() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
}

export function useSetUserRole() {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: BackendRole }) =>
      Api().admin.user.setRole(userId, role),
    onSuccess: invalidate,
  })
}

export function useSetUserSuspended() {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: ({ userId, suspended }: { userId: number; suspended: boolean }) =>
      Api().admin.user.setSuspended(userId, suspended),
    onSuccess: invalidate,
  })
}

// ---- 관리자: 커뮤니티 / 신고 ----

export function useAdminCommunity(type: CommunityContentType) {
  return useQuery({
    queryKey: queryKeys.adminCommunity(type),
    queryFn: () => Api().admin.community.list({ type }),
  })
}

function useInvalidateCommunity() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "community"] })
    queryClient.invalidateQueries({ queryKey: ["admin", "reports"] })
    queryClient.invalidateQueries({ queryKey: ["posts"] })
    queryClient.invalidateQueries({ queryKey: ["post"] })
    queryClient.invalidateQueries({ queryKey: ["issue"] })
  }
}

export function useSetCommunityHidden() {
  const invalidate = useInvalidateCommunity()
  return useMutation({
    mutationFn: ({ type, id, hidden }: { type: CommunityContentType; id: number; hidden: boolean }) =>
      Api().admin.community.setHidden(type, id, hidden),
    onSuccess: invalidate,
  })
}

export function useDeleteCommunityContent() {
  const invalidate = useInvalidateCommunity()
  return useMutation({
    mutationFn: ({ type, id }: { type: CommunityContentType; id: number }) =>
      Api().admin.community.delete(type, id),
    onSuccess: invalidate,
  })
}

export function useAdminReports(status: "PENDING" | "DONE") {
  return useQuery({
    queryKey: queryKeys.adminReports(status),
    queryFn: () => Api().admin.report.list({ status }),
  })
}

export function useRejectReport() {
  const invalidate = useInvalidateCommunity()
  return useMutation({
    mutationFn: (reportId: number) => Api().admin.report.reject(reportId),
    onSuccess: invalidate,
  })
}

export function useRemoveReportedContent() {
  const invalidate = useInvalidateCommunity()
  return useMutation({
    mutationFn: (reportId: number) => Api().admin.report.removeContent(reportId),
    onSuccess: invalidate,
  })
}

/** 대시보드·사이드바 뱃지·이슈 관리가 같은 캐시를 쓰도록 전체 이슈를 한 번에 받는다(상태 탭·검색은 클라이언트에서). */
const ALL_ISSUES_PARAMS: AdminIssueListParams = { page: 0, size: 200 }

export function useAllAdminIssues() {
  return useAdminIssues(ALL_ISSUES_PARAMS)
}

const ALL_USERS_PARAMS: AdminUserListParams = { page: 0, size: 200 }

export function useAllAdminUsers() {
  return useAdminUsers(ALL_USERS_PARAMS)
}
