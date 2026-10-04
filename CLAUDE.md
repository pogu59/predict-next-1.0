@AGENTS.md

## 프로젝트 규칙 (콘텐츠 작업)

- 이 레포는 Next.js 16.3.3이다. AGENTS.md 경고대로 라우팅·훅·데이터 패턴을 쓰기 전에 node_modules/next/dist/docs/ 의 관련 문서를 먼저 확인한다.
- 백엔드는 별도 레포(predict, Spring Boot)다. 이 레포 작업에서 백엔드가 필요한 기능은 가짜 API를 만들지 말고 멈춘 뒤 필요한 엔드포인트를 정리해서 보고한다.
- 데이터는 lib/queries 의 훅(useMe, useIssues, useIssue, useMyVotes, useMyStats 등)과 lib/api 만 쓴다. axios를 직접 import하지 않는다. 쿼리 키는 lib/queries/keys.ts 팩토리로만 만든다.
- 참여 인원은 비공개다. voteCount를 화면에 절대 렌더링하지 않고, 비율은 항상 lib/issues.ts 의 optionPercents() 로 구한다.
- 예상 점수는 lib/issues.ts 의 payout(pct, optionCount, stake) 하나만 쓴다. 적중 시 stake+win 을 돌려받고, 빗나가면 stake-lose 를 돌려받는다(이슈 상세 expLine과 같은 표기).
- 디자인 토큰은 app/globals.css 첫 번째 @theme(bg, surface, ink, ink-2, sub, muted, faint, line, line-2, line-3, track, neutral-fill, brand, brand-soft, brand-fill, brand-mine, brand-on-dark, danger*, warn*, success*)만 쓴다. "레거시 별칭" 블록(card, accent, control, h1 등)은 /game 전용이라 새 코드에서 쓰지 않는다. 그라데이션은 쓰지 않는다.
- 레이아웃 관례: 모바일은 각 페이지가 자체 헤더를 그리고(HeaderLayout의 PC 헤더는 lg 이상에서만 보임), 하단 탭바가 뜨는 페이지는 pb-[100px]. PC는 lg:grid-cols-[minmax(0,1fr)_340px] 2단 + aside는 lg:sticky lg:top-[92px]. 카드는 bg-surface + rounded-[22px]/rounded-3xl, 숫자는 tabular-nums.
- 홈은 `/`(app/page.tsx — 모바일 components/home-hub.tsx 허브, PC components/issue-feed.tsx 그리드)이고, `/issue`는 예측 목록(?filter=open|soon|result)이다.
- 아이콘은 lucide-react 1.45다. 쓰기 전에 node_modules/lucide-react/dist/lucide-react.d.ts 에서 이름을 확인한다(예: Fingerprint가 아니라 FingerprintPattern).
- 문구는 해요체. "돈/베팅/배당/환전" 같은 표현을 쓰지 않고 "신용도", "걸기"를 쓴다. 신용도가 현금 가치가 있는 것처럼 보이는 문구는 금지.
- localStorage/sessionStorage 접근은 항상 try/catch로 감싼다(app/(pages)/game/page.tsx 와 같은 방식). 랜덤·브라우저 저장소에 의존하는 초기값은 마운트 후에 정한다.
- 기존 파일을 prettier로 통째로 재포맷하지 않는다. 기존 파일은 줄 길이 80보다 넓게 쓰여 있어서 전체 포맷하면 diff가 폭발한다. 새 파일만 prettier를 돌리고, 기존 파일은 필요한 줄만 고친다.
- 완료 조건: npx tsc --noEmit, npm run lint, npm run build 가 모두 통과하고, 마지막에 생성/수정한 파일 목록과 각 파일의 한 줄 설명을 보고한다.
