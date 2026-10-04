#!/usr/bin/env node
/**
 * 편성안 JSON의 이슈를 관리자 API로 일괄 등록한다. 기본은 미리보기, --apply 일 때만 실제로 보낸다.
 *
 *   node scripts/seed-issues.mjs <seeds.json> [--apply] [--series=이름]
 *
 * --apply 에는 ADMIN_TOKEN(관리자로 로그인한 브라우저 localStorage의 session_token)이 필요하다.
 * API 주소는 API_BASE_URL → NEXT_PUBLIC_API_BASE_URL → http://localhost:8080 순서로 정한다.
 */
import { readFile } from "node:fs/promises"

const args = process.argv.slice(2)
const file = args.find((a) => !a.startsWith("--"))
const apply = args.includes("--apply")
const seriesArg = args.find((a) => a.startsWith("--series="))
const series = seriesArg ? seriesArg.slice("--series=".length) : null

if (!file) {
  console.error("사용법: node scripts/seed-issues.mjs <seeds.json> [--apply] [--series=이름]")
  process.exit(1)
}

const token = process.env.ADMIN_TOKEN
if (apply && !token) {
  console.error("--apply 에는 ADMIN_TOKEN 환경 변수가 필요해요(관리자 브라우저 localStorage의 session_token).")
  process.exit(1)
}
const baseUrl = (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "")

const raw = JSON.parse(await readFile(file, "utf8"))
// 배열이거나 { issues: [...] } 처럼 배열 하나를 감싼 객체 모두 받는다.
const all = Array.isArray(raw) ? raw : (raw.issues ?? raw.items ?? Object.values(raw).find(Array.isArray) ?? [])
const seeds = series ? all.filter((s) => s.series === series) : all

const pad = (n) => String(n).padStart(2, "0")
/** 백엔드 LocalDateTime 형식(로컬 시각) "YYYY-MM-DDTHH:mm" */
const toLocal = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`

/** 검증 실패 이유(없으면 null). */
function invalidReason(seed) {
  if (!seed.title || !String(seed.title).trim()) return "제목이 없어요"
  const options = Array.isArray(seed.options) ? seed.options.map((o) => String(o).trim()) : []
  if (options.length < 2 || options.length > 6) return `선택지는 2~6개여야 해요(지금 ${options.length}개)`
  if (options.some((o) => !o)) return "빈 선택지가 있어요"
  if (new Set(options).size !== options.length) return "중복된 선택지가 있어요"
  const start = new Date(seed.voteStartAt)
  const deadline = new Date(seed.voteDeadlineAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(deadline.getTime())) return "시작/마감 시각 형식이 잘못됐어요"
  if (deadline <= start) return "마감이 시작보다 빨라요"
  return null
}

const now = new Date()
let ok = 0
let skipped = 0
let failed = 0

for (const seed of seeds) {
  const label = `[${seed.series ?? "시리즈 없음"}] ${seed.title ?? "(제목 없음)"}`
  const reason = invalidReason(seed)
  if (reason) {
    console.log(`✗ 건너뜀 ${label} — ${reason}`)
    skipped++
    continue
  }
  const deadline = new Date(seed.voteDeadlineAt)
  if (deadline <= now) {
    console.log(`✗ 건너뜀 ${label} — 마감이 이미 지났어요`)
    skipped++
    continue
  }
  let voteStartAt = seed.voteStartAt
  if (new Date(voteStartAt) <= now) voteStartAt = toLocal(new Date(now.getTime() + 60_000))

  const payload = {
    title: String(seed.title).trim(),
    description: seed.description ?? null,
    voteStartAt,
    voteDeadlineAt: seed.voteDeadlineAt,
    options: seed.options.map((o) => String(o).trim()),
    ...(seed.categoryId != null ? { categoryId: seed.categoryId } : {}),
    ...(seed.coverImageUrl ? { coverImageUrl: seed.coverImageUrl } : {}),
  }

  if (!apply) {
    const moved = voteStartAt !== seed.voteStartAt ? " (시작을 지금+1분으로 당김)" : ""
    console.log(`• ${label} / ${voteStartAt} → ${payload.voteDeadlineAt}${moved} · ${payload.options.join(" / ")}`)
    ok++
    continue
  }

  try {
    const res = await fetch(`${baseUrl}/api/admin/issues`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    const body = await res.json().catch(() => ({}))
    if (res.ok) {
      console.log(`✓ 등록 #${body.id ?? body.issueId ?? "?"} ${label}`)
      ok++
    } else {
      console.log(`✗ 실패 ${res.status} — ${body.message ?? res.statusText} (${label})`)
      failed++
    }
  } catch (e) {
    console.log(`✗ 실패 network — ${e.message} (${label})`)
    failed++
  }
}

const verb = apply ? "등록" : "미리보기 통과"
console.log(`\n${verb} ${ok}건 · 건너뜀 ${skipped}건${apply ? ` · 실패 ${failed}건` : ""} (전체 ${seeds.length}건${series ? `, 시리즈 "${series}"` : ""})`)
if (failed) process.exitCode = 1
