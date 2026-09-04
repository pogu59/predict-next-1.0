import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { Api, type CreatePostReq, type PostListParams } from "@/lib/api"
import { queryKeys } from "./keys"

export function usePosts(params?: PostListParams) {
  return useQuery({
    queryKey: queryKeys.posts(params),
    queryFn: () => Api().post.list(params),
  })
}

export function usePost(postId: number) {
  return useQuery({
    queryKey: queryKeys.post(postId),
    queryFn: () => Api().post.get(postId),
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (req: CreatePostReq) => Api().post.create(req),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  })
}

export function useDeletePost(postId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => Api().post.delete(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: queryKeys.post(postId) })
    },
  })
}

export function usePostReplies(postId: number) {
  return useQuery({
    queryKey: queryKeys.postReplies(postId),
    queryFn: () => Api().post.replies.list(postId),
  })
}

export function useCreatePostReply(postId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => Api().post.replies.create(postId, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.postReplies(postId) }),
  })
}

export function useDeletePostReply(postId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (replyId: number) => Api().post.replies.delete(postId, replyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.postReplies(postId) }),
  })
}
