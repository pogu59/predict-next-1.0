"use client"

import { useRouter } from "next/navigation"

import { EMAIL_RE, isValidPassword } from "@/lib/validation"
import { AuthField, AuthScreen } from "@/components/auth"

import { useSignup } from "../signup-context"

export default function SignupEmailPage() {
  const router = useRouter()
  const { email, password, passwordConfirm, update } = useSignup()

  const emailOk = EMAIL_RE.test(email)
  const pwOk = isValidPassword(password)
  const pw2Ok = passwordConfirm.length > 0 && passwordConfirm === password
  const ready = emailOk && pwOk && pw2Ok

  return (
    <AuthScreen
      onBack={() => router.push("/login")}
      step="1 / 3"
      progress={33}
      title={
        <>
          이메일과 비밀번호를
          <br className="lg:hidden" /> 입력해 주세요
        </>
      }
      cta={{
        label: "다음",
        enabled: ready,
        onClick: () => {
          if (!ready) return
          update({ via: "email" })
          router.push("/signup/nickname")
        },
      }}
    >
      <div className="flex flex-col gap-4 lg:gap-3">
        <AuthField
          label="이메일"
          value={email}
          onChange={(v) => update({ email: v.trim() })}
          placeholder="name@example.com"
          invalid={!!email && !emailOk}
          message={email && !emailOk ? "이메일 형식을 확인해 주세요" : ""}
          reserveMessage
        />
        <AuthField
          label="비밀번호"
          type="password"
          value={password}
          onChange={(v) => update({ password: v })}
          placeholder="영문, 숫자 포함 8자 이상"
          invalid={!!password && !pwOk}
          message={
            !password ? "" : pwOk ? "사용할 수 있는 비밀번호예요" : "영문과 숫자를 포함해 8자 이상 입력해 주세요"
          }
          messageTone={pwOk ? "success" : "danger"}
          reserveMessage
        />
        <AuthField
          label="비밀번호 확인"
          type="password"
          value={passwordConfirm}
          onChange={(v) => update({ passwordConfirm: v })}
          placeholder="한 번 더 입력"
          invalid={!!passwordConfirm && !pw2Ok}
          message={passwordConfirm && !pw2Ok ? "비밀번호가 일치하지 않아요" : ""}
          reserveMessage
        />
      </div>
    </AuthScreen>
  )
}
