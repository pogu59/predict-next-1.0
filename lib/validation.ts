/** 가입 폼 검증 규칙 — design_handoff README "폼 검증". */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const NICKNAME_RE = /^[가-힣a-zA-Z0-9_]{2,10}$/

/** 8자 이상 + 영문 + 숫자 */
export function isValidPassword(pw: string) {
  return pw.length >= 8 && /[A-Za-z]/.test(pw) && /\d/.test(pw)
}
