"use client"

import { Button } from "@/components/ui/button"
import { getKakaoLoginUrl } from "@/lib/auth"

export default function LoginPage() {
  const handleKakaoLogin = () => {
    window.location.href = getKakaoLoginUrl()
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">예측 게임 로그인</h1>
      <Button
        onClick={handleKakaoLogin}
        className="bg-[#FEE500] text-black hover:bg-[#FEE500]/80"
      >
        카카오로 시작하기
      </Button>
    </div>
  )
}
