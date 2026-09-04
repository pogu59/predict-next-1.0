import "@tanstack/react-query"

import type { ApiError } from "@/lib/api"

/**
 * TanStack Query v5의 공식 확장 지점 — 이 파일을 한 번이라도 로드하면(QueryProvider에서
 * import) 모든 useQuery/useMutation의 error가 기본 Error 대신 ApiError로 추론된다.
 * 이 덕분에 매 훅 호출부에서 `useQuery<Issue, ApiError>`처럼 반복 명시하거나
 * `error as ApiError`로 캐스팅할 필요가 없다.
 */
declare module "@tanstack/react-query" {
  interface Register {
    defaultError: ApiError
  }
}
