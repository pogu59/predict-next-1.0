import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { Api, type CreatePostReq, type PostListParams, type ReportReason } from "@/lib/api"
import { queryKeys } from "./keys"

/** 필터·검색어를 바꾸는 동안 이전 결과를 그대로 보여줘 목록이 깜빡이지 않게 한다. */
export function usePosts(params?: PostListParams) {
  return useQuery({
    queryKey: queryKeys.posts(params),
    queryFn: () => Api().post.list(params),
    placeholderData: keepPreviousData,
  })
}

export function usePost(postId: number) {
  return useQuery({
    queryKey: queryKeys.post(postId),
    queryFn: () => Api().post.get(postId),
  })
}

function useInvalidatePost() {
  const queryClient = useQueryClient()
  return (postId?: number) => {
    queryClient.invalidateQueries({ queryKey: ["posts"] })
    queryClient.invalidateQueries({ queryKey: ["admin", "community"] })
    if (postId !== undefined) queryClient.invalidateQueries({ queryKey: queryKeys.post(postId) })
  }
}

export function useCreatePost() {
  const invalidate = useInvalidatePost()
  return useMutation({
    mutationFn: (req: CreatePostReq) => Api().post.create(req),
    onSuccess: () => invalidate(),
  })
}

export function useUpdatePost(postId: number) {
  const invalidate = useInvalidatePost()
  return useMutation({
    mutationFn: (req: CreatePostReq) => Api().post.update(postId, req),
    onSuccess: () => invalidate(postId),
  })
}

export function useDeletePost(postId: number) {
  const invalidate = useInvalidatePost()
  return useMutation({
    mutationFn: () => Api().post.delete(postId),
    onSuccess: () => invalidate(postId),
  })
}

export function useLikePost(postId: number) {
  const invalidate = useInvalidatePost()
  return useMutation({
    mutationFn: () => Api().post.like(postId),
    onSuccess: () => invalidate(postId),
  })
}

export function useReportPost(postId: number) {
  return useMutation({
    mutationFn: (reason: ReportReason) => Api().post.report(postId, reason),
  })
}

export function useHidePostAuthor(postId: number) {
  const invalidate = useInvalidatePost()
  return useMutation({
    mutationFn: () => Api().post.hideAuthor(postId),
    onSuccess: () => invalidate(),
  })
}

export function usePostReplies(postId: number) {
  return useQuery({
    queryKey: queryKeys.postReplies(postId),
    queryFn: () => Api().post.replies.list(postId),
  })
}

function useInvalidatePostReplies(postId: number) {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.postReplies(postId) })
    queryClient.invalidateQueries({ queryKey: ["posts"] })
  }
}

export function useCreatePostReply(postId: number) {
  const invalidate = useInvalidatePostReplies(postId)
  return useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId?: number }) =>
      Api().post.replies.create(postId, content, parentId),
    onSuccess: invalidate,
  })
}

export function useDeletePostReply(postId: number) {
  const invalidate = useInvalidatePostReplies(postId)
  return useMutation({
    mutationFn: (replyId: number) => Api().post.replies.delete(postId, replyId),
    onSuccess: invalidate,
  })
}

export function useLikePostReply(postId: number) {
  const invalidate = useInvalidatePostReplies(postId)
  return useMutation({
    mutationFn: (replyId: number) => Api().post.replies.like(postId, replyId),
    onSuccess: invalidate,
  })
}

export function useReportPostReply(postId: number) {
  return useMutation({
    mutationFn: ({ replyId, reason }: { replyId: number; reason: ReportReason }) =>
      Api().post.replies.report(postId, replyId, reason),
  })
}

export function useUploadImage() {
  return useMutation({
    mutationFn: (file: File) => Api().upload.image(file),
  })
}
