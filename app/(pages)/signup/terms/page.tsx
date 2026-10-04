"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import type { TermsAgreement } from "@/lib/api"
import { useCompleteSocialSignup, useSignupEmail } from "@/lib/queries/auth"
import { AuthScreen, TermsAllRow, TermsRow } from "@/components/auth"
import { useToast } from "@/components/ui/toast"

import { useSignup } from "../signup-context"

const TERMS: { key: keyof TermsAgreement; label: string; required: boolean }[] = [
  { key: "age", label: "만 14세 이상입니다", required: true },
  { key: "service", label: "서비스 이용약관 동의", required: true },
  { key: "privacy", label: "개인정보 수집·이용 동의", required: true },
  { key: "marketing", label: "마케팅 정보 수신 동의", required: false },
]

export default function SignupTermsPage() {
  const router = useRouter()
  const showToast = useToast()
  const { via, email, password, nickname, terms, update } = useSignup()
  const signupEmail = useSignupEmail()
  const socialSignup = useCompleteSocialSignup()

  const social = via !== "email"
  const requiredOk = terms.age && terms.service && terms.privacy
  const allOn = requiredOk && terms.marketing
  const pending = signupEmail.isPending || socialSignup.isPending

  // 닉네임 단계를 거치지 않고 들어왔으면 돌려보낸다.
  useEffect(() => {
    if (!nickname) router.replace(social ? `/signup/nickname?via=${via}` : "/signup/email")
  }, [nickname, social, via, router])

  function finish() {
    if (!requiredOk || pending) return
    const callbacks = {
      onSuccess: () => {
        router.replace("/issue")
        showToast("가입 완료! 신용도 500을 드렸어요")
      },
      onError: (error: { message: string }) => showToast(error.message),
    }
    if (via === "email") signupEmail.mutate({ email, password, nickname, terms }, callbacks)
    else socialSignup.mutate({ via, nickname, terms }, callbacks)
  }

  return (
    <AuthScreen
      onBack={() => router.push(social ? `/signup/nickname?via=${via}` : "/signup/nickname")}
      step={social ? "2 / 2" : "3 / 3"}
      progress={100}
      title="약관에 동의해 주세요"
      pcGap={20}
      cta={{ label: "가입 완료", enabled: requiredOk, loading: pending, onClick: finish }}
    >
      <div className="-mt-0.5 flex flex-col gap-6 lg:mt-0 lg:gap-5">
        <TermsAllRow
          on={allOn}
          onToggle={() => update({ terms: { age: !allOn, service: !allOn, privacy: !allOn, marketing: !allOn } })}
        />
        <div className="flex flex-col gap-1 lg:gap-0">
          {TERMS.map((t) => (
            <TermsRow
              key={t.key}
              label={t.label}
              required={t.required}
              on={terms[t.key]}
              onToggle={() => update({ terms: { ...terms, [t.key]: !terms[t.key] } })}
            />
          ))}
        </div>
      </div>
    </AuthScreen>
  )
}
