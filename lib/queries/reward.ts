import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { Api } from "@/lib/api"

import { useMe } from "./auth"
import { queryKeys } from "./keys"

/** 내 리워드 포인트 지갑. 로그인했을 때만 부른다(비로그인이면 data가 undefined). */
export function useWallet() {
  const { data: me } = useMe()
  return useQuery({
    queryKey: queryKeys.wallet(me?.userId ?? 0),
    queryFn: () => Api().reward.me(),
    enabled: me !== undefined,
  })
}

/** 교환 신청·취소는 잔액과 관리자 승인 큐를 함께 바꾼다. */
function useInvalidateWallet() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ["wallet"] })
    queryClient.invalidateQueries({ queryKey: ["admin", "exchanges"] })
  }
}

export function useRequestExchange() {
  const invalidate = useInvalidateWallet()
  return useMutation({
    mutationFn: (productCode: string) =>
      Api().reward.requestExchange(productCode),
    onSuccess: invalidate,
  })
}

export function useCancelExchange() {
  const invalidate = useInvalidateWallet()
  return useMutation({
    mutationFn: (exchangeId: number) => Api().reward.cancelExchange(exchangeId),
    onSuccess: invalidate,
  })
}
