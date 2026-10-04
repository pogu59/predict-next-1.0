# 이슈 편성 가이드

`docs/content/`에는 분기별 이슈 편성안(`issue-seeds-YYYY-qN.json`)과 이 문서를 둔다.
편성안의 각 항목은 관리자 이슈 생성 API(`IssueUpsertPayload`) 필드에 편성용 필드 `series` · `resolveAt` · `note`를 더한 것이다.
편성용 필드는 서버로 보내지 않는다.

```json
// 예시 항목(실제 편성안 아님)
{
  "series": "노벨 위크",
  "title": "2026 노벨 문학상, 아시아 작가가 받을까?",
  "description": "판정 기준 · 노벨위원회 공식 발표 · 10월 8일 20:00(KST) · 공동 수상이면 한 명이라도 아시아 국적이면 '받는다'\n…",
  "voteStartAt": "2026-10-05T09:00",
  "voteDeadlineAt": "2026-10-08T19:00",
  "options": ["받는다", "못 받는다"],
  "resolveAt": "2026-10-08T20:00",
  "note": "발표 1시간 전 마감"
}
```

## 편성 원칙

1. **판정 기준은 description 첫 줄에 쓴다.** 순서는 `판정 기준 · 출처 · 시각 · 경계값`.
   경계값을 반드시 적는다(예: "0.1mm 이상이면 비", "0.0도는 영하 아님", "같으면 '아니다'").
   판정 기준이 모호하면 결과 확정 때 분쟁이 생긴다.
2. **마감은 연장만 되고 단축은 안 된다**(`sp_extend_topic_deadline` — open 상태에서 연장만 허용).
   일정이 흔들리는 이슈(경기 일정, 발표일 미정)는 일부러 마감을 이르게 잡고, 필요하면 늘린다.
3. **결과가 빨리 나오는 이슈와 오래 걸리는 이슈를 섞는다.**
   당일 결과(노벨 위크, 데일리 날씨)로 리듬을 만들고, 몇 주 걸리는 이슈(롤드컵, 수능)로 꾸준히 돌아오게 한다.
4. **뻔한 이슈는 피한다.** 90:10이 뻔하면 다수 쪽 보상이 거의 없어 아무도 재미를 못 본다.
   3~4지선다나 구간(예: "1~3골 / 4~5골 / 6골 이상")으로 접전을 만든다.
5. **정치 이슈는 평가성 표현 없이** 판정 기준과 출처만 쓴다. "논란의", "충격의" 같은 수식어 금지.
6. **모든 이슈에 `series`를 붙인다.** 나중에 시리즈 필터·구독 알림으로 이어진다.

## 일괄 등록 스크립트

```bash
# 미리보기(아무것도 보내지 않음) — 검증 실패·마감 지난 항목은 이유와 함께 건너뜀
npm run seed:issues -- docs/content/issue-seeds-2026-q4.json

# 한 시리즈만 미리보기
npm run seed:issues -- docs/content/issue-seeds-2026-q4.json --series=노벨\ 위크

# 실제 등록(운영 서버)
ADMIN_TOKEN=... API_BASE_URL=http://158.247.247.27:8080 \
  npm run seed:issues -- docs/content/issue-seeds-2026-q4.json --apply --series=노벨\ 위크
```

- 검증: 제목 필수, 선택지 2~6개·중복 없음, 마감 > 시작.
- 마감이 이미 지난 항목은 건너뛰고, 시작이 지났으면 지금+1분으로 당겨서 보낸다.
- 보내는 필드: `title`, `description`, `voteStartAt`, `voteDeadlineAt`, `options`, (있으면) `categoryId`, `coverImageUrl`.
- 결과: `✓ 등록 #id` / `✗ 실패 status — 서버 message`.

### ADMIN_TOKEN 얻는 법

1. 관리자 계정으로 사이트에 로그인한다.
2. 브라우저 개발자 도구(F12) → Application(애플리케이션) → Local Storage → 사이트 주소.
3. `session_token` 값을 복사해 `ADMIN_TOKEN`으로 쓴다. 토큰은 비밀번호와 같으니 커밋하거나 공유하지 않는다.
