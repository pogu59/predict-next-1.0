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

export type Me = {
  userId: number
  nickname: string
  credibilityScore: number
  tier: string
  role: "USER" | "ADMIN"
}

export async function fetchMe(): Promise<Me | null> {
  const token = getSessionToken()
  if (!token) return null

  const res = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  return res.json()
}
