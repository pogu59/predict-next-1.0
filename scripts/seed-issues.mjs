// 로컬 DB에 실화 기반 이슈 50개를 "진짜 플로우"(POST /api/admin/issues)로 넣는 시드 스크립트.
// lib/api/mock.ts의 목데이터와 같은 카테고리/템플릿을 쓰지만, 이건 실제 백엔드에 HTTP로
// 요청을 보내 진짜 DB row를 만든다 — 그래서 관리자 세션 토큰이 필요하다.
//
// 사용법:
//   ADMIN_TOKEN=<로그인한 관리자 계정의 session_token> node scripts/seed-issues.mjs
//   (선택) API_BASE_URL=http://localhost:8080 로 백엔드 주소 override 가능
//
// 토큰 구하는 법: 관리자 계정으로 카카오 로그인한 뒤, 브라우저 devtools 콘솔에서
//   localStorage.getItem("session_token")
// 를 실행해 나온 값을 그대로 쓰면 된다.

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080"
const ADMIN_TOKEN = process.env.ADMIN_TOKEN

if (!ADMIN_TOKEN) {
  console.error(
    "ADMIN_TOKEN 환경변수가 없습니다. 관리자로 로그인한 뒤 브라우저 콘솔에서\n" +
      '  localStorage.getItem("session_token")\n' +
      "로 얻은 값을 ADMIN_TOKEN=... 으로 넘겨서 다시 실행하세요.",
  )
  process.exit(1)
}

const CATEGORIES = [
  { id: 1, name: "정치" },
  { id: 2, name: "스포츠" },
  { id: 3, name: "E스포츠" },
  { id: 4, name: "경제" },
  { id: 5, name: "날씨" },
]

// 고정 시드 PRNG(mulberry32) — lib/api/mock.ts와 동일한 알고리즘. 재현 가능하게 하려고 시드만 다르게 뒀다.
function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20260906)
const randInt = (min, max) => min + Math.floor(rand() * (max - min + 1))
const pick = (arr) => arr[randInt(0, arr.length - 1)]

const TITLE_TEMPLATES = {
  1: [
    { title: "여당 지지율이 이번 주 여론조사에서 {n}%를 넘을까요?", options: ["넘는다", "못 넘는다"] },
    { title: "국민연금 개혁안이 이번 정기국회에서 통과될까요?", options: ["통과된다", "무산된다"] },
    { title: "다음 개각에서 교체되는 장관이 {n}명 이상일까요?", options: ["그렇다", "아니다"] },
    { title: "이번 재보궐선거에서 여당 후보가 당선될까요?", options: ["당선된다", "낙선한다"] },
    { title: "국회 본회의가 이번 달 안에 열릴까요?", options: ["열린다", "안 열린다"] },
    { title: "대통령 지지율이 다음 조사에서 오를까요?", options: ["오른다", "내린다"] },
    { title: "이번 개헌 논의가 연내 공식화될까요?", options: ["된다", "안 된다"] },
    { title: "야당 대표가 이번 달 교체될까요?", options: ["교체된다", "유임된다"] },
  ],
  2: [
    { title: "손흥민이 이번 시즌 리그 {n}골을 넘길까요?", options: ["넘긴다", "못 넘긴다"] },
    { title: "한국 야구 대표팀이 이번 국제대회 4강에 갈까요?", options: ["간다", "못 간다"] },
    { title: "K리그 우승팀이 이번 시즌 무패로 우승할까요?", options: ["그렇다", "아니다"] },
    { title: "김민재 소속팀이 이번 챔피언스리그 8강에 갈까요?", options: ["간다", "못 간다"] },
    { title: "이번 올림픽에서 한국 금메달이 {n}개를 넘을까요?", options: ["넘는다", "못 넘는다"] },
    { title: "이번 KBO 한국시리즈가 7차전까지 갈까요?", options: ["간다", "안 간다"] },
    { title: "국가대표팀이 다음 경기에서 승리할까요?", options: ["승리한다", "못 한다"] },
    { title: "이번 시즌 프로농구 우승팀이 작년과 같을까요?", options: ["같다", "다르다"] },
  ],
  3: [
    { title: "T1이 이번 LCK 스프링에서 우승할까요?", options: ["우승한다", "못 한다"] },
    { title: "페이커가 이번 시즌 MVP를 수상할까요?", options: ["수상한다", "못 한다"] },
    { title: "한국 팀이 이번 월드 챔피언십 결승에 진출할까요?", options: ["진출한다", "못 한다"] },
    { title: "젠지가 이번 서머 시즌 세트 전적 전승을 할까요?", options: ["그렇다", "아니다"] },
    { title: "한국 발로란트 대표팀이 국제대회 8강에 갈까요?", options: ["간다", "못 간다"] },
    { title: "이번 롤드컵 결승이 한국 팀끼리 열릴까요?", options: ["그렇다", "아니다"] },
    { title: "다음 시즌 개막전에서 작년 우승팀이 승리할까요?", options: ["승리한다", "패배한다"] },
  ],
  4: [
    { title: "한국은행 기준금리가 이번 분기에 인하될까요?", options: ["인하된다", "동결/인상된다"] },
    { title: "원/달러 환율이 이번 달 {n}원을 넘을까요?", options: ["넘는다", "못 넘는다"] },
    { title: "코스피 지수가 연내 {n}을 돌파할까요?", options: ["돌파한다", "못 한다"] },
    { title: "이번 분기 실업률이 지난 분기보다 낮을까요?", options: ["낮다", "높다"] },
    { title: "삼성전자 주가가 이번 달 말까지 오를까요?", options: ["오른다", "내린다"] },
    { title: "이번 소비자물가상승률이 {n}%를 넘을까요?", options: ["넘는다", "못 넘는다"] },
    { title: "다음 금통위에서 만장일치 결정이 나올까요?", options: ["나온다", "안 나온다"] },
    { title: "이번 분기 수출액이 전년 동기보다 늘어날까요?", options: ["늘어난다", "줄어든다"] },
  ],
  5: [
    { title: "이번 주 서울 강수확률이 {n}%를 넘는 날이 있을까요?", options: ["있다", "없다"] },
    { title: "올해 첫눈이 다음 달 안에 내릴까요?", options: ["내린다", "안 내린다"] },
    { title: "이번 여름 폭염일수가 작년보다 많을까요?", options: ["많다", "적다"] },
    { title: "다음 주에 태풍이 한반도에 상륙할까요?", options: ["상륙한다", "안 한다"] },
    { title: "이번 달 미세먼지 '나쁨' 일수가 {n}일을 넘을까요?", options: ["넘는다", "못 넘는다"] },
    { title: "다음 주말 서울에 눈이 내릴까요?", options: ["내린다", "안 내린다"] },
    { title: "이번 겨울 한파주의보가 {n}회 이상 발령될까요?", options: ["그렇다", "아니다"] },
  ],
}

function randomTitle(categoryId) {
  const template = pick(TITLE_TEMPLATES[categoryId])
  const n = randInt(2, 30) * (categoryId === 4 ? 100 : 1)
  return { title: template.title.replace("{n}", String(n)), options: template.options }
}

// LocalDateTime 형식(오프셋/Z 없음)으로 맞춘다 — 백엔드 응답 예시(voteStartAt 등)와 동일 포맷.
// toISOString()은 항상 UTC라 그대로 슬라이스하면 서버(KST, Asia/Seoul) 기준으로는 9시간
// 과거로 파싱된다("투표 시작 시각은 현재 시각 이후여야 합니다" 400의 원인이었다) —
// KST 벽시계 값이 나오도록 +9시간 shift한 뒤 슬라이스한다.
function toLocalDateTime(date) {
  const kst = new Date(date.getTime() + 9 * 3600000)
  return kst.toISOString().slice(0, 19)
}

const ISSUE_COUNT = 50

async function createIssue(payload) {
  const res = await fetch(`${API_BASE_URL}/api/admin/issues`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ADMIN_TOKEN}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`)
  }
  return res.json()
}

async function main() {
  const now = Date.now()
  const categoryCounts = {}
  let ok = 0
  let failed = 0

  for (let i = 0; i < ISSUE_COUNT; i++) {
    const category = pick(CATEGORIES)
    const { title, options } = randomTitle(category.id)
    // voteStartAt은 서버가 "현재 시각 이후"를 요구해서, 요청 왕복 지연을 감안해 넉넉히 미래로 잡는다.
    const voteStartAt = new Date(now + randInt(1, 3) * 3600000)
    const voteDeadlineAt = new Date(voteStartAt.getTime() + randInt(3, 14) * 86400000)

    const payload = {
      categoryId: category.id,
      title,
      description: null,
      voteStartAt: toLocalDateTime(voteStartAt),
      voteDeadlineAt: toLocalDateTime(voteDeadlineAt),
      options,
    }

    try {
      const created = await createIssue(payload)
      categoryCounts[category.name] = (categoryCounts[category.name] ?? 0) + 1
      ok++
      console.log(`[${i + 1}/${ISSUE_COUNT}] created #${created.id} · ${category.name} · ${title}`)
    } catch (err) {
      failed++
      console.error(`[${i + 1}/${ISSUE_COUNT}] FAILED · ${category.name} · ${title}\n  ${err.message}`)
    }
  }

  console.log("\n=== 완료 ===")
  console.log(`성공 ${ok}건 / 실패 ${failed}건`)
  console.log("카테고리별:", categoryCounts)
}

main()
