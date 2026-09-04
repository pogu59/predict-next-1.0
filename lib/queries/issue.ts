import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { Api, type CastVoteReq, type Me } from "@/lib/api"
import { queryKeys } from "./keys"

/** 목록 화면에 있는 동안 다른 사람의 투표를 반영하려고 5초 간격으로 다시 조회한다. */
export function useIssues(userId?: number) {
  return useQuery({
    queryKey: queryKeys.issues(userId),
    queryFn: () => Api().issue.list(userId),
    refetchInterval: 5000,
  })
}

/**
 * 다른 사람의 투표를 화면에 반영하려고 5초 간격으로 다시 조회한다 — CONFIRMED가 되면
 * 득표수가 더 안 바뀌니 멈춘다. usePolling(lib/issues.ts) + 수동 fetch였던 걸
 * refetchInterval로 그대로 옮긴 것.
 */
export function useIssue(issueId: number, userId?: number) {
  return useQuery({
    queryKey: queryKeys.issue(issueId, userId),
    queryFn: () => Api().issue.get(issueId, userId),
    refetchInterval: (query) => (query.state.data?.status === "CONFIRMED" ? false : 5000),
  })
}

export function useCastVote(issueId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (req: CastVoteReq) => Api().issue.vote(issueId, req),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["issue", issueId] })
      queryClient.invalidateQueries({ queryKey: ["issues"] })
      // 서버가 베팅 직후 잔액을 같이 내려주므로, me를 다시 안 불러도 헤더/카드의 신용도를 바로 갱신한다.
      queryClient.setQueryData<Me>(queryKeys.me, (me) =>
        me ? { ...me, credibilityScore: result.remainingCredibility } : me,
      )
    },
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

export function useCreateIssueReply(issueId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => Api().issue.replies.create(issueId, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.issueReplies(issueId) }),
  })
}

export function useDeleteIssueReply(issueId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (replyId: number) => Api().issue.replies.delete(issueId, replyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.issueReplies(issueId) }),
  })
}
