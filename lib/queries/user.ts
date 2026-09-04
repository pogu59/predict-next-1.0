import { useQuery } from "@tanstack/react-query"

import { Api } from "@/lib/api"
import { queryKeys } from "./keys"

export function useMyStats(userId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.myStats(userId ?? 0),
    queryFn: () => Api().user.stats(userId as number),
    enabled: userId !== undefined,
  })
}

export function useMyVotes(userId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.myVotes(userId ?? 0),
    queryFn: () => Api().user.votes(userId as number),
    enabled: userId !== undefined,
  })
}
