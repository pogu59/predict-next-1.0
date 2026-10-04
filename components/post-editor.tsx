"use client"

import { Camera, ImagePlus, PenLine, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import type { CreatePostReq, PostTopic } from "@/lib/api"
import { useMe } from "@/lib/queries/auth"
import { useUploadImage } from "@/lib/queries/post"
import { POST_TOPICS } from "@/lib/post-topics"
import { cn } from "@/lib/utils"
import { ImageBox } from "@/components/ui/image-box"
import { useToast } from "@/components/ui/toast"

const MAX_IMAGES = 4

type PostEditorProps = {
  mode: "create" | "edit"
  initial?: CreatePostReq
  submitting: boolean
  onSubmit: (req: CreatePostReq) => void
}

/** 글쓰기/수정 화면. 제목(최대 60자)·본문이 모두 있어야 등록할 수 있고, 이미지는 최대 4장. */
export function PostEditor({ mode, initial, submitting, onSubmit }: PostEditorProps) {
  const router = useRouter()
  const showToast = useToast()
  const { data: me, isLoading: meLoading } = useMe()
  const upload = useUploadImage()
  const fileInput = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(initial?.title ?? "")
  const [content, setContent] = useState(initial?.content ?? "")
  const [images, setImages] = useState<string[]>(initial?.images ?? [])
  const [topic, setTopic] = useState<PostTopic | null>(initial?.topic ?? null)

  useEffect(() => {
    if (!meLoading && !me) router.replace("/login")
  }, [meLoading, me, router])

  const ready = title.trim().length > 0 && content.trim().length > 0
  const heading = mode === "edit" ? "글 수정" : "글쓰기"
  const submitLabel = mode === "edit" ? "완료" : "등록"

  function back() {
    if (window.history.length > 1) router.back()
    else router.push("/board")
  }

  function submit() {
    if (!ready || submitting) return
    onSubmit({ title: title.trim(), content: content.trim(), images, topic })
  }

  async function addFiles(files: FileList | null) {
    if (!files) return
    const room = MAX_IMAGES - images.length
    for (const file of Array.from(files).slice(0, room)) {
      try {
        const { url } = await upload.mutateAsync(file)
        setImages((list) => (list.length < MAX_IMAGES ? [...list, url] : list))
      } catch (e) {
        showToast((e as { message?: string }).message ?? "이미지를 올리지 못했어요")
      }
    }
    if (fileInput.current) fileInput.current.value = ""
  }

  const pickFiles = () => images.length < MAX_IMAGES && fileInput.current?.click()
  const removeImage = (index: number) => setImages((list) => list.filter((_, i) => i !== index))

  /** 말머리 고르기 — 다시 누르면 해제(말머리 없음). */
  const topicPicker = (pc: boolean) => (
    <div className={cn("flex flex-wrap items-center gap-1.5", pc ? "px-7 pt-5" : "px-5 pt-4")}>
      <span className="pr-1 text-[13px] font-semibold text-muted">말머리</span>
      {POST_TOPICS.map((t) => (
        <button
          key={t.key}
          type="button"
          aria-pressed={topic === t.key}
          onClick={() => setTopic((cur) => (cur === t.key ? null : t.key))}
          className={cn(
            "rounded-full px-3 py-1.5 text-[13px] font-bold",
            topic === t.key ? "bg-ink text-white" : "bg-track text-sub",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )

  const thumbs = (pc: boolean) =>
    images.map((src, i) => (
      <div key={src} className={cn("relative flex-none", pc ? "size-[84px]" : "size-[72px]")}>
        <ImageBox src={src} className={cn("size-full", pc ? "rounded-2xl" : "rounded-[14px]")} />
        <button
          type="button"
          onClick={() => removeImage(i)}
          aria-label="이미지 삭제"
          className={cn(
            "absolute -top-1.5 -right-1.5 grid place-items-center rounded-full bg-ink text-white",
            pc ? "size-6" : "size-[22px]",
          )}
        >
          <X className={pc ? "size-3.5" : "size-[15px]"} />
        </button>
      </div>
    ))

  return (
    <>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => addFiles(e.target.files)}
      />

      {/* 모바일 */}
      <div className="flex min-h-dvh flex-col bg-surface lg:hidden">
        <div className="flex h-[52px] items-center justify-between border-b border-line px-3">
          <button type="button" onClick={back} className="p-2" aria-label="닫기">
            <X className="size-6" />
          </button>
          <span className="text-base font-bold">{heading}</span>
          <button
            type="button"
            onClick={submit}
            className={cn("p-2 text-base font-bold", ready ? "text-brand" : "text-disabled-ink")}
          >
            {submitLabel}
          </button>
        </div>
        {topicPicker(false)}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={60}
          placeholder="제목"
          className="px-5 pt-4 pb-3.5 text-xl font-bold tracking-[-0.02em] outline-none"
        />
        <div className="mx-5 h-px bg-line" />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={"자유롭게 이야기를 나눠보세요.\n서로를 존중하는 글을 부탁드려요."}
          className="min-h-[260px] flex-1 resize-none px-5 py-4 text-base leading-[1.7] outline-none"
        />
        <div className="flex gap-2 overflow-x-auto border-t border-line px-5 pt-3.5 pb-7">
          <button
            type="button"
            onClick={pickFiles}
            className="flex size-[72px] flex-none flex-col items-center justify-center gap-[3px] rounded-[14px] border-[1.5px] border-dashed border-[#D6D6D3] text-muted"
          >
            <Camera className="size-6" />
            <span className="text-[11px] font-semibold tabular-nums">
              {images.length}/{MAX_IMAGES}
            </span>
          </button>
          {thumbs(false)}
        </div>
      </div>

      {/* PC */}
      <div className="mx-auto hidden max-w-[780px] flex-col overflow-hidden rounded-3xl bg-surface lg:flex">
        <div className="flex h-16 items-center justify-between border-b border-line px-6">
          <span className="flex items-center gap-2 text-lg font-extrabold">
            <PenLine className="size-[19px] text-brand" />
            {heading}
          </span>
          <button type="button" onClick={back} aria-label="닫기">
            <X className="size-[22px] text-sub" />
          </button>
        </div>
        {topicPicker(true)}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={60}
          placeholder="제목"
          className="px-7 pt-4 pb-4 text-2xl font-bold tracking-[-0.02em] outline-none"
        />
        <div className="mx-7 h-px bg-line" />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={"자유롭게 이야기를 나눠보세요.\n서로를 존중하는 글을 부탁드려요."}
          className="min-h-[320px] resize-y px-7 py-[18px] text-base leading-[1.75] outline-none"
        />
        <div className="flex flex-wrap gap-2.5 border-t border-line px-7 py-4">
          <button
            type="button"
            onClick={pickFiles}
            className="flex size-[84px] flex-none flex-col items-center justify-center gap-1 rounded-2xl border-[1.5px] border-dashed border-[#D6D6D3] text-muted hover:border-brand hover:text-brand"
          >
            <ImagePlus className="size-6" />
            <span className="text-xs font-semibold">
              {images.length}/{MAX_IMAGES}
            </span>
          </button>
          {thumbs(true)}
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-6 pt-4 pb-[22px]">
          <button type="button" onClick={back} className="h-12 rounded-[14px] bg-track px-[22px] text-[15px] font-bold">
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            className={cn(
              "h-12 rounded-[14px] px-[26px] text-[15px] font-bold",
              ready ? "bg-brand text-white" : "bg-disabled-bg text-muted",
            )}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </>
  )
}
