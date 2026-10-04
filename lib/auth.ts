const SESSION_TOKEN_KEY = "session_token"

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"
}

export function getKakaoLoginUrl() {
  return `${getApiBaseUrl()}/oauth2/authorization/kakao`
}

export function saveSessionToken(token: string) {
  localStorage.setItem(SESSION_TOKEN_KEY, token)
}

export function getSessionToken() {
  return localStorage.getItem(SESSION_TOKEN_KEY)
}

export function clearSessionToken() {
  localStorage.removeItem(SESSION_TOKEN_KEY)
}

const RETURN_TO_KEY = "return_to"

/** 앱 안 경로만 허용 — "//host"나 브라우저가 "/"로 바꾸는 "\\"가 섞인 주소는 외부로 나갈 수 있어 막는다. */
const isAppPath = (path: string) => path.startsWith("/") && !path.startsWith("//") && !path.includes("\\")

/** 로그인 후 돌아올 앱 안 경로를 기억한다(예: 도전장 링크). 외부 주소는 받지 않는다. */
export function saveReturnTo(path: string) {
  if (!isAppPath(path)) return
  try {
    sessionStorage.setItem(RETURN_TO_KEY, path)
  } catch {
    // 저장이 막히면 로그인 후 홈으로 간다.
  }
}

/** 기억해 둔 경로를 꺼내고 지운다. 없으면 fallback. */
export function takeReturnTo(fallback = "/") {
  try {
    const path = sessionStorage.getItem(RETURN_TO_KEY)
    sessionStorage.removeItem(RETURN_TO_KEY)
    return path && isAppPath(path) ? path : fallback
  } catch {
    return fallback
  }
}
