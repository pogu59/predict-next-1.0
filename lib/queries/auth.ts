import { useQuery } from "@tanstack/react-query"

import { Api } from "@/lib/api"

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
 * useMe()가 들고 있는 React Query 캐시에서 파생시킨 얇은 훅. 별도 상태(Zustand 등)로
 * 다시 들고 있지 않는 이유: 로그인 정보의 출처는 항상 useMe() 캐시 하나뿐이어야 한다 —
 * 두 번째 저장소를 따로 두면 로그아웃/토큰 만료/재로그인 때 둘을 손으로 맞춰 동기화해야
 * 하고, 그 동기화가 어긋나는 순간 "로그인된 것처럼 보이는데 API는 401" 같은 버그가 생긴다.
 * isAuthenticated/authId/name만 필요한 컴포넌트는 useMe() 전체 대신 이 훅을 쓰면 된다.
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
