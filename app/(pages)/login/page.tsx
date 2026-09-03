"use client"

import { getKakaoLoginUrl } from "@/lib/auth"

export default function LoginPage() {
  const handleKakaoLogin = () => {
    window.location.href = getKakaoLoginUrl()
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 sm:px-6">
      <div className="flex w-full max-w-[440px] flex-col gap-[18px] rounded-2xl border border-line bg-card p-5">
        <div className="flex flex-col gap-2.5">
          <span className="text-h1">predict</span>
          <p className="text-body text-pretty text-ink-muted">
            로그인하면 투표 기록이 저장되고, 적중에 따라 신용도 점수와 티어가
            쌓입니다.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleKakaoLogin}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500]"
          >
            <span className="text-label" style={{ color: "rgba(0,0,0,.85)" }}>
              카카오 로그인
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
