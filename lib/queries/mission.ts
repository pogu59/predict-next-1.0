import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { Api, type RewardWallet, type SubmitMissionReq } from "@/lib/api"

import { useMe } from "./auth"
import { queryKeys } from "./keys"

/** 지금 참여할 수 있는 미션. 비로그인도 볼 수 있고, 로그인하면 내 상태(myStatus)가 붙는다. */
export function useMissions() {
  const { data: me, isLoading: meLoading } = useMe()
  return useQuery({
    queryKey: queryKeys.missions(me?.userId),
    queryFn: () => Api().mission.list(),
    // 로그인 확인 전에 비로그인 키로 한 번 더 부르지 않도록 me를 기다린다.
    enabled: !meLoading,
  })
}

export function useMission(missionId: number | undefined) {
  const { data: me, isLoading: meLoading } = useMe()
  return useQuery({
    queryKey: queryKeys.mission(missionId ?? 0, me?.userId),
    queryFn: () => Api().mission.get(missionId as number),
    enabled: missionId !== undefined && !meLoading,
  })
}

/** 참여한 사람만 볼 수 있다 — 참여 전에는 enabled를 false로 둔다. */
export function useMissionResults(
  missionId: number | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.missionResults(missionId ?? 0),
    queryFn: () => Api().mission.results(missionId as number),
    enabled: missionId !== undefined && enabled,
  })
}

/**
 * 제출 → 서버 검수 → 통과하면 바로 적립. 응답에 처리 후 잔액이 같이 오므로 지갑 캐시의 잔액은
 * 바로 고치고, 내역·목록은 다시 불러온다.
 */
export function useSubmitMission(missionId: number) {
  const queryClient = useQueryClient()
  const { data: me } = useMe()
  return useMutation({
    mutationFn: (req: SubmitMissionReq) => Api().mission.submit(missionId, req),
    onSuccess: (result) => {
      if (me) {
        queryClient.setQueryData<RewardWallet>(
          queryKeys.wallet(me.userId),
          (wallet) =>
            wallet ? { ...wallet, balance: result.balance } : wallet,
        )
      }
      queryClient.invalidateQueries({ queryKey: ["missions"] })
      queryClient.invalidateQueries({ queryKey: ["mission", missionId] })
      queryClient.invalidateQueries({
        queryKey: queryKeys.missionResults(missionId),
      })
      queryClient.invalidateQueries({ queryKey: ["wallet"] })
    },
  })
}
