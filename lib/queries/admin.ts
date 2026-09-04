import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { Api, type AdminIssueListParams, type AdminUserListParams, type IssueUpsertPayload } from "@/lib/api"
import { queryKeys } from "./keys"

// ---- 관리자: 이슈 ----

export function useAdminIssues(params: AdminIssueListParams) {
  return useQuery({
    queryKey: queryKeys.adminIssues(params),
    queryFn: () => Api().admin.issue.list(params),
  })
}

export function useAdminIssue(issueId: number) {
  return useQuery({
    queryKey: queryKeys.adminIssue(issueId),
    queryFn: () => Api().admin.issue.get(issueId),
  })
}

function useInvalidateAdminIssue(issueId?: number) {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "issues"] })
    if (issueId !== undefined) queryClient.invalidateQueries({ queryKey: queryKeys.adminIssue(issueId) })
  }
}

export function useCreateAdminIssue() {
  const invalidate = useInvalidateAdminIssue()
  return useMutation({
    mutationFn: (payload: IssueUpsertPayload) => Api().admin.issue.create(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateAdminIssue(issueId: number) {
  const invalidate = useInvalidateAdminIssue(issueId)
  return useMutation({
    mutationFn: (payload: IssueUpsertPayload) => Api().admin.issue.update(issueId, payload),
    onSuccess: invalidate,
  })
}

export function useExtendAdminIssueDeadline(issueId: number) {
  const invalidate = useInvalidateAdminIssue(issueId)
  return useMutation({
    mutationFn: (newDeadline: string) => Api().admin.issue.extendDeadline(issueId, newDeadline),
    onSuccess: invalidate,
  })
}

export function useConfirmAdminIssue(issueId: number) {
  const invalidate = useInvalidateAdminIssue(issueId)
  return useMutation({
    mutationFn: (correctOptionId: number) => Api().admin.issue.confirm(issueId, correctOptionId),
    onSuccess: invalidate,
  })
}

export function useCorrectAdminIssue(issueId: number) {
  const invalidate = useInvalidateAdminIssue(issueId)
  return useMutation({
    mutationFn: () => Api().admin.issue.correct(issueId),
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

export function useAdminUser(userId: number) {
  return useQuery({
    queryKey: queryKeys.adminUser(userId),
    queryFn: () => Api().admin.user.get(userId),
  })
}
