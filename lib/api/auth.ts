import { getApiBaseUrl, getSessionToken } from "@/lib/auth"
import { request } from "./client"
import type { ApiError, ApiInterface, AuthTokenResult, Me, NicknameCheckResult } from "./types"

const PATHS = {
  me: "/api/auth/me",
  login: "/api/auth/login",
  signup: "/api/auth/signup",
  nicknameCheck: "/api/auth/nickname-check",
  socialSignup: "/api/auth/social-signup",
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

  // 서버가 302로 /auth/callback?token=...(&isNew=true&provider=kakao) 을 돌려준다.
  // 서버에 OAuth 클라이언트가 등록된 공급자만 동작한다(현재 kakao).
  socialUrl: (provider) => `${getApiBaseUrl()}/oauth2/authorization/${provider}`,

  loginEmail: (req) => request<AuthTokenResult>({ method: "POST", url: PATHS.login, data: req }),

  signupEmail: (req) => request<AuthTokenResult>({ method: "POST", url: PATHS.signup, data: req }),

  checkNickname: (nickname) =>
    request<NicknameCheckResult>({ method: "GET", url: PATHS.nicknameCheck, params: { nickname } }),

  completeSocialSignup: (req) => request<Me>({ method: "POST", url: PATHS.socialSignup, data: req }),
}
