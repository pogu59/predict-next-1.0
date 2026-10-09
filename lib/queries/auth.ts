import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  Api,
  type EmailLoginReq,
  type EmailSignupReq,
  type Me,
  type SocialSignupReq,
} from "@/lib/api"
import { clearSessionToken, saveSessionToken } from "@/lib/auth"

import { queryKeys } from "./keys"

/**
 * 로그인 안 한 상태(토큰 없음 or 401)는 정상적인 상태지 에러가 아니다 — 호출부는
 * isError로 화면을 깨지 말고 data가 undefined인 걸로 "비로그인"을 판단한다.
 */
export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => Api().auth.me(),
    retry: false,
    throwOnError: false,
  })
}

/**
 * useMe()가 들고 있는 React Query 캐시에서 파생시킨 얇은 훅. 로그인 정보의 출처는 항상
 * useMe() 캐시 하나뿐이어야 한다 — 두 번째 저장소를 따로 두면 로그아웃/토큰 만료/재로그인 때
 * 손으로 동기화해야 하고, 그게 어긋나는 순간 "로그인된 것처럼 보이는데 API는 401" 같은 버그가 생긴다.
 */
export function useAuthStore() {
  const { data: me, isLoading } = useMe()
  return {
    isAuthenticated: !!me,
    authId: me?.userId,
    name: me?.nickname,
    isLoading,
  }
}

function useSaveToken() {
  const queryClient = useQueryClient()
  return ({ token }: { token: string }) => {
    saveSessionToken(token)
    queryClient.invalidateQueries({ queryKey: queryKeys.me })
  }
}

export function useLoginEmail() {
  const saveToken = useSaveToken()
  return useMutation({
    mutationFn: (req: EmailLoginReq) => Api().auth.loginEmail(req),
    onSuccess: saveToken,
  })
}

export function useSignupEmail() {
  const saveToken = useSaveToken()
  return useMutation({
    mutationFn: (req: EmailSignupReq) => Api().auth.signupEmail(req),
    onSuccess: saveToken,
  })
}

export function useCompleteSocialSignup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (req: SocialSignupReq) => Api().auth.completeSocialSignup(req),
    onSuccess: (me) => queryClient.setQueryData<Me>(queryKeys.me, me),
  })
}

/** 형식이 맞는 닉네임만 서버에 물어본다. 디바운스는 호출부가 한다. */
export function useNicknameCheck(nickname: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.nickname(nickname),
    queryFn: () => Api().auth.checkNickname(nickname),
    enabled,
    staleTime: 30_000,
  })
}

/** 서버 세션 무효화 API가 없어 클라이언트 토큰과 캐시만 지운다. */
export function useLogout() {
  const queryClient = useQueryClient()
  return () => {
    clearSessionToken()
    queryClient.removeQueries({ queryKey: queryKeys.me })
    queryClient.removeQueries({ queryKey: ["myVotes"] })
    queryClient.removeQueries({ queryKey: ["myStats"] })
    queryClient.removeQueries({ queryKey: ["wallet"] })
  }
}
