"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect } from "react"

import { saveSessionToken } from "@/lib/auth"
import { queryKeys } from "@/lib/queries/keys"
import { useToast } from "@/components/ui/toast"

const PROVIDERS = ["kakao", "google", "apple"]

function SocialCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const showToast = useToast()

  useEffect(() => {
    const token = searchParams.get("token")
    if (!token) {
      router.replace("/login")
      return
    }
    saveSessionToken(token)
    // 방금 막 로그인했으니 헤더 등이 들고 있던 "비로그인" me 캐시를 새로 받아오게 한다.
    queryClient.invalidateQueries({ queryKey: queryKeys.me })

    // 신규 가입자면 서버가 콜백에 isNew=true(&provider=kakao)를 실어 닉네임·약관 단계로 보낸다.
    if (searchParams.get("isNew") === "true") {
      const provider = searchParams.get("provider")
      const via = provider && PROVIDERS.includes(provider) ? provider : "kakao"
      router.replace(`/signup/nickname?via=${via}`)
      return
    }
    router.replace("/")
    showToast("다시 오신 걸 환영해요")
  }, [router, searchParams, queryClient, showToast])

  return <div className="flex min-h-dvh items-center justify-center text-sm text-muted">로그인 처리 중...</div>
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <SocialCallback />
    </Suspense>
  )
}
