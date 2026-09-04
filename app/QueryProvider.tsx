"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

import "@/lib/queries/registerQueryError"

/**
 * QueryClient는 컴포넌트 상태로 한 번만 만든다(useState 초기화 함수) — 모듈 스코프에 두면
 * Next.js App Router의 서버 렌더링 사이에 여러 요청이 캐시를 공유해버리는 문제가 생긴다.
 * 401은 재시도해봐야 계속 401이라 딱 한 번만 시도한다(그 외 실패는 최대 2번).
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5_000,
            retry: (failureCount, error) => (error.statusCode === 401 ? false : failureCount < 2),
          },
          mutations: {
            retry: false,
          },
        },
      }),
  )

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
