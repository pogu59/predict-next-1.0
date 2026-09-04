import axios, { type AxiosError, type AxiosRequestConfig } from "axios"

import { clearSessionToken, getApiBaseUrl, getSessionToken } from "@/lib/auth"
import type { ApiError } from "./types"

/**
 * axios를 직접 import하는 건 이 파일뿐이다. 다른 네임스페이스 파일은 여기서 내보내는
 * request<T>()만 쓴다. 인스턴스는 모듈 스코프에서 한 번만 만들어지므로(모듈은 캐싱된다)
 * Api()를 몇 번 호출해도 인터셉터가 중복 등록되지 않는다.
 *
 * predict 백엔드는 statusCode 봉투가 아니라 실제 HTTP 상태코드를 쓰고, 성공 응답은 DTO를
 * 봉투 없이 그대로 내려준다(ApiExceptionHandler.java, ErrorResponse.java 참고). 그래서
 * 여기서는 axios 응답을 곧장 payload로 취급하고, 실패는 HTTP status를 그대로
 * ApiError.statusCode로 정규화한다. 나중에 {statusCode, payload} 봉투를 쓰는 백엔드로
 * 바뀌더라도 고칠 곳은 이 인터셉터 두 개뿐이다.
 */
const instance = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { "Content-Type": "application/json" },
})

instance.interceptors.request.use((config) => {
  const token = getSessionToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

instance.interceptors.response.use(
  (res) => res.data,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response) {
      const status = error.response.status
      // 유효하지 않다고 확인된 토큰은 더 들고 있어봐야 다음 요청도 똑같이 실패하니 지운다.
      if (status === 401) clearSessionToken()
      const apiError: ApiError = {
        statusCode: status,
        message: error.response.data?.message ?? "요청에 실패했습니다",
      }
      return Promise.reject(apiError)
    }
    const apiError: ApiError = {
      statusCode: 0,
      message: "서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.",
    }
    return Promise.reject(apiError)
  },
)

/**
 * 응답 인터셉터가 이미 res.data로 봉투를 벗겨내므로, 런타임 값은 항상 T다. 하지만 axios
 * 1.20의 request<T,R>는 R이 조건부 타입(AxiosResponseResult)이라 제네릭 R=T를 그대로
 * 넘겨도 컴파일 타임에 T로 좁혀지지 않는다(naked type parameter는 조건부 타입이 평가되지
 * 않음) — 그래서 이 한 줄에서만 타입을 단언한다. 다른 어떤 네임스페이스 파일도, 어떤
 * 호출부도 이후로는 이 사실을 몰라도 되고 캐스팅할 필요가 없다: request<T>()를 쓰는 순간
 * 항상 완전히 타입이 붙은 Promise<T>를 받는다.
 */
export function request<T>(config: AxiosRequestConfig): Promise<T> {
  return instance.request(config) as Promise<T>
}
