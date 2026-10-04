"use client"

import { createContext, useCallback, useContext, useState } from "react"

import type { SocialProvider, TermsAgreement } from "@/lib/api"

export type SignupVia = SocialProvider | "email"

type SignupState = {
  via: SignupVia
  email: string
  password: string
  passwordConfirm: string
  nickname: string
  terms: TermsAgreement
}

type SignupContextValue = SignupState & {
  update: (patch: Partial<SignupState>) => void
}

const INITIAL: SignupState = {
  via: "email",
  email: "",
  password: "",
  passwordConfirm: "",
  nickname: "",
  terms: { age: false, service: false, privacy: false, marketing: false },
}

const SignupContext = createContext<SignupContextValue | null>(null)

export function useSignup() {
  const value = useContext(SignupContext)
  if (!value) throw new Error("useSignup은 /signup 레이아웃 안에서만 쓸 수 있어요")
  return value
}

/** 가입 단계(이메일 → 닉네임 → 약관) 사이에서 입력값을 유지한다 — 레이아웃은 하위 이동 중에도 언마운트되지 않는다. */
export function SignupProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(INITIAL)
  const update = useCallback((patch: Partial<SignupState>) => setState((s) => ({ ...s, ...patch })), [])
  return (
    <SignupContext.Provider value={{ ...state, update }}>
      {children}
    </SignupContext.Provider>
  )
}

export const VIA_LABEL: Record<SocialProvider, string> = {
  kakao: "카카오",
  google: "Google",
  apple: "Apple",
}

export function isSocialVia(via: string | null): via is SocialProvider {
  return via === "kakao" || via === "google" || via === "apple"
}
