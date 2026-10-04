"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { takeReturnTo } from "@/lib/auth"
import { useLoginEmail } from "@/lib/queries/auth"
import { EMAIL_RE } from "@/lib/validation"
import { AuthField, AuthScreen } from "@/components/auth"
import { useToast } from "@/components/ui/toast"

export default function EmailLoginPage() {
  const router = useRouter()
  const showToast = useToast()
  const login = useLoginEmail()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [failed, setFailed] = useState(false)

  const valid = EMAIL_RE.test(email) && password.length > 0

  function submit() {
    if (!valid) {
      setFailed(true)
      return
    }
    login.mutate(
      { email, password },
      {
        onSuccess: () => {
          router.replace(takeReturnTo())
          showToast("다시 오신 걸 환영해요")
        },
        onError: () => setFailed(true),
      },
    )
  }

  const links = (
    <div className="flex justify-center gap-3.5 text-[13px] text-muted">
      <span>비밀번호 찾기</span>
      <span>·</span>
      <Link href="/signup/email">회원가입</Link>
    </div>
  )

  return (
    <AuthScreen
      onBack={() => router.push("/login")}
      title="이메일로 로그인"
      titleClassName="lg:text-[28px]"
      pcGap={24}
      cta={{ label: "로그인", enabled: valid, loading: login.isPending, onClick: submit }}
      links={links}
    >
      <div className="flex flex-col gap-3.5">
        <AuthField
          label="이메일"
          value={email}
          onChange={(v) => {
            setEmail(v)
            setFailed(false)
          }}
          placeholder="name@example.com"
        />
        <AuthField
          label="비밀번호"
          type="password"
          value={password}
          onChange={(v) => {
            setPassword(v)
            setFailed(false)
          }}
          placeholder="비밀번호"
        />
        {failed && <span className="text-[13px] text-danger">이메일 또는 비밀번호를 확인해 주세요.</span>}
      </div>
    </AuthScreen>
  )
}
