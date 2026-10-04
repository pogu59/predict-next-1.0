"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"

import { useMe } from "@/lib/queries/auth"
import { usePost, useUpdatePost } from "@/lib/queries/post"
import { PostEditor } from "@/components/post-editor"
import { useToast } from "@/components/ui/toast"

export default function BoardEditPage() {
  const params = useParams<{ id: string }>()
  const postId = Number(params.id)
  const router = useRouter()
  const showToast = useToast()
  const { data: me } = useMe()
  const { data: post, isLoading, error } = usePost(postId)
  const updatePost = useUpdatePost(postId)

  // 남의 글 수정 화면으로 직접 들어오면 상세로 돌려보낸다.
  useEffect(() => {
    if (post && me && post.authorId !== me.userId) router.replace(`/board/${postId}`)
  }, [post, me, postId, router])

  if (isLoading || error || !post) {
    return (
      <div className="min-h-dvh bg-surface py-20 text-center text-sm text-faint lg:min-h-0 lg:bg-transparent">
        {isLoading ? "불러오는 중..." : (error?.message ?? "존재하지 않는 게시글입니다")}
      </div>
    )
  }

  return (
    <PostEditor
      mode="edit"
      initial={{ title: post.title, content: post.content, images: post.images, topic: post.topic ?? null }}
      submitting={updatePost.isPending}
      onSubmit={(req) =>
        updatePost.mutate(req, {
          onSuccess: () => {
            router.replace(`/board/${postId}`)
            showToast("수정했어요")
          },
          onError: (e) => showToast(e.message),
        })
      }
    />
  )
}
