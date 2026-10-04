"use client"

import { useRouter } from "next/navigation"

import { useCreatePost } from "@/lib/queries/post"
import { PostEditor } from "@/components/post-editor"
import { useToast } from "@/components/ui/toast"

export default function BoardWritePage() {
  const router = useRouter()
  const showToast = useToast()
  const createPost = useCreatePost()

  return (
    <PostEditor
      mode="create"
      submitting={createPost.isPending}
      onSubmit={(req) =>
        createPost.mutate(req, {
          onSuccess: (post) => {
            router.replace(`/board/${post.id}`)
            showToast("글을 올렸어요")
          },
          onError: (e) => showToast(e.message),
        })
      }
    />
  )
}
