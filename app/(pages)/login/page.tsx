"use client"

import { Apple, Gift, Globe, Mail, MessageCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Api, type SocialProvider } from "@/lib/api"
import { Logo } from "@/components/ui/brand"
import { ImageBox } from "@/components/ui/image-box"

const SOCIAL_BUTTONS: {
  provider: SocialProvider
  label: string
  className: string
  Icon: typeof Globe
}[] = [
  { provider: "kakao", label: "카카오로 시작하기", className: "bg-kakao text-kakao-ink", Icon: MessageCircle },
  {
    provider: "google",
    label: "Google로 시작하기",
    className: "border-[1.5px] border-line-2 bg-surface text-ink",
    Icon: Globe,
  },
  { provider: "apple", label: "Apple로 시작하기", className: "bg-ink text-white", Icon: Apple },
]

const BUTTON = "flex h-[54px] items-center justify-center gap-2 rounded-2xl text-base font-bold"

function startSocial(provider: SocialProvider) {
  window.location.href = Api().auth.socialUrl(provider)
}

function SignupBadge() {
  return (
    <span className="flex items-center gap-1.5 self-start rounded-[9px] bg-brand-soft px-[11px] py-[7px] text-[13px] font-bold text-brand">
      <Gift className="size-[15px]" />
      가입하면 신용도 500 지급
    </span>
  )
}

function LoginLink({ className }: { className?: string }) {
  return (
    <div className={`flex gap-1.5 text-sm text-sub ${className ?? ""}`}>
      <span>이미 계정이 있나요?</span>
      <Link href="/login/email" className="font-bold text-brand">
        로그인
      </Link>
    </div>
  )
}

export default function WelcomePage() {
  const router = useRouter()

  return (
    <>
      {/* 모바일 */}
      <div className="flex min-h-dvh flex-col bg-surface px-6 pb-7 lg:hidden">
        <div className="flex flex-1 flex-col justify-center gap-[18px] pt-3">
          <ImageBox className="mb-2 h-[260px] rounded-[28px]" iconSize={32} />
          <Logo className="text-[40px] tracking-[-0.05em]" />
          <span className="text-2xl leading-[1.4] font-bold tracking-[-0.03em]">
            다가올 일을 예측하고
            <br />
            신용도를 쌓아보세요
          </span>
          <span className="text-sm leading-[1.6] text-sub">현금·코인·아이템 없이 신용도 점수와 티어만 오갑니다.</span>
          <SignupBadge />
        </div>
        <div className="flex flex-col gap-2.5">
          {SOCIAL_BUTTONS.map(({ provider, label, className }) => (
            <button key={provider} type="button" onClick={() => startSocial(provider)} className={`${BUTTON} ${className}`}>
              {label}
            </button>
          ))}
          <button type="button" onClick={() => router.push("/signup/email")} className={`${BUTTON} bg-track text-ink`}>
            이메일로 가입하기
          </button>
          <LoginLink className="justify-center pt-2.5" />
        </div>
      </div>

      {/* PC */}
      <div className="hidden min-h-[calc(100vh-200px)] grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-center gap-14 lg:grid">
        <div className="flex max-w-[420px] flex-col gap-[22px]">
          <span className="text-5xl leading-[1.2] font-extrabold tracking-[-0.045em]">
            다가올 일을 예측하고
            <br />
            신용도를 쌓아보세요
          </span>
          <span className="text-base leading-[1.6] text-sub">현금·코인·아이템 없이 신용도 점수와 티어만 오갑니다.</span>
          <SignupBadge />
          <div className="mt-2.5 flex flex-col gap-2.5">
            {SOCIAL_BUTTONS.map(({ provider, label, className, Icon }) => (
              <button key={provider} type="button" onClick={() => startSocial(provider)} className={`${BUTTON} ${className}`}>
                <Icon className="size-[19px]" />
                {label}
              </button>
            ))}
            <button type="button" onClick={() => router.push("/signup/email")} className={`${BUTTON} bg-line text-ink`}>
              <Mail className="size-[19px]" />
              이메일로 가입하기
            </button>
          </div>
          <LoginLink />
        </div>
        <ImageBox className="h-[560px] rounded-[36px]" iconSize={40} />
      </div>
    </>
  )
}
