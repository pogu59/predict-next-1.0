import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { Api, type AdminCrewPayload } from "@/lib/api"

import { queryKeys } from "./keys"

export function useCrews() {
  return useQuery({
    queryKey: queryKeys.crews,
    queryFn: () => Api().crew.list(),
  })
}

/** 이번 주(week 생략) 또는 지난주 순위. 이번 주는 실시간 계산이라 1분마다 다시 받는다. */
export function useCrewRanking(week?: string) {
  return useQuery({
    queryKey: queryKeys.crewRanking(week),
    queryFn: () => Api().crew.ranking(week),
    refetchInterval: week ? false : 60_000,
  })
}

export function useCrewTopMembers(crewId: number | undefined, week?: string) {
  return useQuery({
    queryKey: queryKeys.crewTopMembers(crewId ?? 0, week),
    queryFn: () => Api().crew.topMembers(crewId as number, week),
    enabled: crewId !== undefined,
  })
}

export function useMyCrew(userId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.myCrew(userId ?? 0),
    queryFn: () => Api().crew.mine(),
    enabled: userId !== undefined,
  })
}

/** 가입·변경 후 내 크루와 순위·인원 수, 작성자 크루 배지가 붙는 댓글·게시글을 다시 받는다. */
export function useJoinCrew() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (crewId: number) => Api().crew.join(crewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myCrew"] })
      queryClient.invalidateQueries({ queryKey: queryKeys.crews })
      queryClient.invalidateQueries({ queryKey: ["crew"] })
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["post"] })
      queryClient.invalidateQueries({ queryKey: ["issue"] })
    },
  })
}

// ---- 관리자 ----

export function useAdminCrews() {
  return useQuery({
    queryKey: queryKeys.adminCrews,
    queryFn: () => Api().admin.crew.list(),
  })
}

function useInvalidateCrews() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.adminCrews })
    queryClient.invalidateQueries({ queryKey: queryKeys.crews })
  }
}

export function useSaveAdminCrew() {
  const invalidate = useInvalidateCrews()
  return useMutation({
    mutationFn: ({
      crewId,
      payload,
    }: {
      crewId?: number
      payload: AdminCrewPayload
    }) =>
      crewId === undefined
        ? Api().admin.crew.create(payload)
        : Api().admin.crew.update(crewId, payload),
    onSuccess: invalidate,
  })
}
