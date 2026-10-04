import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { Api, type CastVoteReq, type Me, type ReportReason } from "@/lib/api"
import { queryKeys } from "./keys"

/** 목록 화면에 있는 동안 다른 사람의 투표를 반영하려고 5초 간격으로 다시 조회한다. */
export function useIssues(userId?: number) {
  return useQuery({
    queryKey: queryKeys.issues(userId),
    queryFn: () => Api().issue.list(userId),
    refetchInterval: 5000,
  })
}

/** 다른 사람의 투표를 화면에 반영하려고 5초 간격으로 다시 조회한다 — CONFIRMED가 되면 멈춘다. */
export function useIssue(issueId: number, userId?: number) {
  return useQuery({
    queryKey: queryKeys.issue(issueId, userId),
    queryFn: () => Api().issue.get(issueId, userId),
    refetchInterval: (query) => (query.state.data?.status === "CONFIRMED" ? false : 5000),
  })
}

function useInvalidateIssue(issueId: number) {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ["issue", issueId] })
    queryClient.invalidateQueries({ queryKey: ["issues"] })
    queryClient.invalidateQueries({ queryKey: ["myVotes"] })
  }
}

export function useCastVote(issueId: number) {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateIssue(issueId)
  return useMutation({
    mutationFn: (req: CastVoteReq) => Api().issue.vote(issueId, req),
    onSuccess: (result) => {
      invalidate()
      // 서버가 베팅 직후 잔액을 같이 내려주므로, me를 다시 안 불러도 헤더/카드의 신용도를 바로 갱신한다.
      queryClient.setQueryData<Me>(queryKeys.me, (me) =>
        me ? { ...me, credibilityScore: result.remainingCredibility } : me,
      )
    },
  })
}

/** 선택 변경 — 스테이크는 그대로라 신용도는 바뀌지 않는다. */
export function useChangeVote(issueId: number) {
  const invalidate = useInvalidateIssue(issueId)
  return useMutation({
    mutationFn: (optionId: number) => Api().issue.changeVote(issueId, optionId),
    onSuccess: invalidate,
  })
}

/** polling: 부모 이슈가 CONFIRMED가 아닐 때만 5초 간격으로 새 댓글을 반영한다. */
export function useIssueReplies(issueId: number, polling = true) {
  return useQuery({
    queryKey: queryKeys.issueReplies(issueId),
    queryFn: () => Api().issue.replies.list(issueId),
    refetchInterval: polling ? 5000 : false,
  })
}

function useInvalidateIssueReplies(issueId: number) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.issueReplies(issueId) })
}

export function useCreateIssueReply(issueId: number) {
  const invalidate = useInvalidateIssueReplies(issueId)
  return useMutation({
    mutationFn: (content: string) => Api().issue.replies.create(issueId, content),
    onSuccess: invalidate,
  })
}

export function useDeleteIssueReply(issueId: number) {
  const invalidate = useInvalidateIssueReplies(issueId)
  return useMutation({
    mutationFn: (replyId: number) => Api().issue.replies.delete(issueId, replyId),
    onSuccess: invalidate,
  })
}

export function useLikeIssueReply(issueId: number) {
  const invalidate = useInvalidateIssueReplies(issueId)
  return useMutation({
    mutationFn: (replyId: number) => Api().issue.replies.like(issueId, replyId),
    onSuccess: invalidate,
  })
}

export function useReportIssueReply(issueId: number) {
  return useMutation({
    mutationFn: ({ replyId, reason }: { replyId: number; reason: ReportReason }) =>
      Api().issue.replies.report(issueId, replyId, reason),
  })
}
