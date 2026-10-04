"use client"

import { Link as LinkIcon } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect } from "react"

import { useDebounced } from "@/lib/issues"
import { useNicknameCheck } from "@/lib/queries/auth"
import { NICKNAME_RE } from "@/lib/validation"
import { AuthField, AuthScreen } from "@/components/auth"

import { isSocialVia, useSignup, VIA_LABEL } from "../signup-context"

function SignupNickname() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { via, email, nickname, update } = useSignup()

  // 소셜 콜백에서 ?via=kakao 로 들어오면 소셜 가입(2단계)으로 전환한다.
  const viaParam = searchParams.get("via")
  useEffect(() => {
    if (isSocialVia(viaParam) && via !== viaParam) update({ via: viaParam })
  }, [viaParam, via, update])

  const social = via !== "email"

  // 이메일 가입인데 1단계를 건너뛰고 들어왔으면 처음으로 돌려보낸다.
  useEffect(() => {
    if (!social && !isSocialVia(viaParam) && !email) router.replace("/signup/email")
  }, [social, viaParam, email, router])

  const formatOk = NICKNAME_RE.test(nickname)
  const debounced = useDebounced(nickname, 300)
  const check = useNicknameCheck(debounced, formatOk && debounced === nickname)
  const checked = formatOk && debounced === nickname && check.data !== undefined
  const taken = checked && !check.data?.available
  const ok = checked && !taken

  const message = !nickname
    ? ""
    : taken
      ? "이미 사용 중인 닉네임이에요"
      : !formatOk
        ? "2~10자의 한글, 영문, 숫자만 쓸 수 있어요"
        : ok
          ? "멋진 닉네임이에요!"
          : ""

  return (
    <AuthScreen
      onBack={() => router.push(social ? "/login" : "/signup/email")}
      step={social ? "1 / 2" : "2 / 3"}
      progress={social ? 50 : 66}
      badge={
        social && (
          <span className="flex items-center gap-1 self-start rounded-[7px] bg-brand-soft px-[9px] py-[5px] text-xs font-bold text-brand">
            <LinkIcon className="hidden size-[13px] lg:block" />
            {VIA_LABEL[via]} 계정 연결됨
          </span>
        )
      }
      title={
        <>
          어떤 이름으로
          <br className="lg:hidden" /> 활동할까요?
        </>
      }
      cta={{ label: "다음", enabled: ok, onClick: () => ok && router.push("/signup/terms") }}
    >
      <AuthField
        label="닉네임"
        value={nickname}
        onChange={(v) => update({ nickname: v.trim() })}
        maxLength={10}
        placeholder="2~10자, 한글·영문·숫자"
        invalid={!!nickname && (taken || !formatOk)}
        message={message}
        messageTone={ok ? "success" : "danger"}
        reserveMessage
        suffix={`${nickname.length}/10`}
      />
    </AuthScreen>
  )
}

export default function SignupNicknamePage() {
  return (
    <Suspense>
      <SignupNickname />
    </Suspense>
  )
}
