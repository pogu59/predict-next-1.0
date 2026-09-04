"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"

import { saveSessionToken } from "@/lib/auth"
import { queryKeys } from "@/lib/queries/keys"

function KakaoCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  useEffect(() => {
    const token = searchParams.get("token")
    if (token) {
      saveSessionToken(token)
      // 방금 막 로그인했으니 헤더 등이 들고 있던 "비로그인" me 캐시를 새로 받아오게 한다.
      queryClient.invalidateQueries({ queryKey: queryKeys.me })
      router.replace("/")
    } else {
      router.replace("/login")
    }
  }, [router, searchParams, queryClient])

  return (
    <div className="flex min-h-screen items-center justify-center">
      로그인 처리 중...
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <KakaoCallback />
    </Suspense>
  )
}
