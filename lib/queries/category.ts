import { useQuery } from "@tanstack/react-query"

import { Api } from "@/lib/api"
import { queryKeys } from "./keys"

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => Api().category.list(),
    staleTime: Infinity, // 카테고리 5개는 사실상 고정값 — 세션 내내 다시 받아올 필요 없다
  })
}
