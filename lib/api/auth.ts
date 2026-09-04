import { getSessionToken } from "@/lib/auth"
import { request } from "./client"
import type { ApiError, ApiInterface, Me } from "./types"

const PATHS = {
  me: "/api/auth/me",
} as const

export const authApi: ApiInterface["auth"] = {
  me: () => {
    // 토큰이 아예 없으면 요청 자체를 보내지 않는다 — /api/auth/me는 Authorization 헤더가
    // 필수라 헤더 없이 보내면 "잘못된 요청"(400)으로 잡혀서 401(로그인 필요)과 구분이 안 된다.
    if (!getSessionToken()) {
      const notLoggedIn: ApiError = { statusCode: 401, message: "로그인이 필요합니다" }
      return Promise.reject(notLoggedIn)
    }
    return request<Me>({ method: "GET", url: PATHS.me })
  },
}
