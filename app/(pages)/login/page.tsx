"use client"

import { getKakaoLoginUrl } from "@/lib/auth"
import { Icon } from "@/components/icon"

export default function LoginPage() {
  const handleKakaoLogin = () => {
    window.location.href = getKakaoLoginUrl()
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="flex w-full max-w-[440px] flex-col gap-[18px] rounded-2xl border border-line bg-card p-5">
        <div className="flex flex-col gap-2.5">
          <span className="text-h1">predict</span>
          <p className="text-body text-ink-muted text-pretty">
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
          <span className="text-caption text-ink-subtle">
            현재 카카오 로그인만 지원합니다.
          </span>
        </div>

        <div className="flex gap-2.5 rounded-xl border border-dashed border-line-strong bg-sunken p-4">
          <Icon
            name="info"
            filled={false}
            size={18}
            className="flex-none text-ink-subtle"
          />
          <div className="flex flex-col gap-1">
            <span className="text-label">이 서비스는 투표 게임입니다</span>
            <span className="text-caption text-ink-subtle text-pretty">
              신용도 점수는 순위·티어 표시용이며 현금화할 수 없습니다.
              현금·코인 베팅과 환전 기능은 제공하지 않습니다.
            </span>
          </div>
        </div>

        <span className="text-caption text-ink-faint text-pretty">
          로그인하면 이용약관 및 개인정보처리방침에 동의한 것으로 봅니다.
        </span>
      </div>
    </div>
  )
}
