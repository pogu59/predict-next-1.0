"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { saveSessionToken } from "@/lib/auth"

function KakaoCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get("token")
    if (token) {
      saveSessionToken(token)
      router.replace("/")
    } else {
      router.replace("/login")
    }
  }, [router, searchParams])

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
