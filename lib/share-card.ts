import { ARCHETYPES, type PredictionDna } from "@/lib/insights"
import { tierImage, tierLabel } from "@/lib/tier"

const W = 1080
const H = 1350
const PAD = 80
const BRAND = "#5B4BFF"
const INK = "#111113"

type ShareCardInput = {
  nickname: string
  tier: string
  credit: number
  dna: PredictionDna
  /** "wrapped"는 연말 결산 카드 — 상단 문구와 지표 3칸(예측 수·적중률·최고 수익)이 바뀐다. */
  variant?: "dna" | "wrapped"
  /** variant "wrapped"일 때의 결산 값. */
  wrapped?: {
    year: number
    total: number
    accuracy: number | null
    bestDelta: number | null
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** 한글은 띄어쓰기가 적어 글자 단위로 줄을 바꾼다. maxLines를 넘으면 마지막 줄 끝을 …로 줄인다. */
function wrapChars(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) {
  const lines: string[] = []
  let line = ""
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxWidth && line) {
      lines.push(line)
      line = ch.trim() ? ch : ""
    } else {
      line += ch
    }
  }
  if (line) lines.push(line)
  if (lines.length <= maxLines) return lines
  const kept = lines.slice(0, maxLines)
  let last = kept[maxLines - 1]
  while (last && ctx.measureText(last + "…").width > maxWidth)
    last = last.slice(0, -1)
  kept[maxLines - 1] = last + "…"
  return kept
}

/** 내 예측 성향 공유 카드(1080×1350 PNG). 배경은 brand 단색. */
export async function renderShareCard({
  nickname,
  tier,
  credit,
  dna,
  variant = "dna",
  wrapped,
}: ShareCardInput): Promise<Blob> {
  const isWrapped = variant === "wrapped" && wrapped != null
  const family = getComputedStyle(document.body).fontFamily
  await Promise.all([
    document.fonts.load(`800 116px ${family}`),
    document.fonts.load(`600 38px ${family}`),
  ])
  const font = (weight: 600 | 800, size: number) =>
    `${weight} ${size}px ${family}`

  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("canvas를 쓸 수 없어요")

  ctx.fillStyle = BRAND
  ctx.fillRect(0, 0, W, H)
  ctx.textBaseline = "alphabetic"

  // 로고 "predict" + 마침표(ink)
  ctx.font = font(800, 60)
  ctx.fillStyle = "#fff"
  ctx.fillText("predict", PAD, 140)
  const logoWidth = ctx.measureText("predict").width
  ctx.fillStyle = INK
  ctx.fillText(".", PAD + logoWidth, 140)

  // 우상단 티어 pill
  const pillText = `${tierLabel(tier)} · ${credit.toLocaleString()}`
  ctx.font = font(800, 34)
  const iconSize = 44
  const pillW = 28 + iconSize + 12 + ctx.measureText(pillText).width + 30
  const pillH = 76
  const pillX = W - PAD - pillW
  const pillY = 88
  ctx.fillStyle = "rgba(255,255,255,0.18)"
  ctx.beginPath()
  ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2)
  ctx.fill()
  try {
    const icon = await loadImage(tierImage(tier))
    ctx.drawImage(
      icon,
      pillX + 28,
      pillY + (pillH - iconSize) / 2,
      iconSize,
      iconSize,
    )
  } catch {
    // 아이콘을 못 불러와도 카드는 만든다.
  }
  ctx.fillStyle = "#fff"
  ctx.fillText(pillText, pillX + 28 + iconSize + 12, pillY + 50)

  // 닉네임 · 유형
  const archetype = ARCHETYPES[dna.archetype]
  ctx.font = font(600, 40)
  ctx.fillStyle = "rgba(255,255,255,0.72)"
  ctx.fillText(
    isWrapped
      ? `${nickname}님의 ${wrapped.year} 예측 결산`
      : `${nickname}님의 예측 성향`,
    PAD,
    330,
  )

  ctx.font = font(800, 116)
  ctx.fillStyle = "#fff"
  let y = 470
  for (const line of wrapChars(ctx, archetype.name, W - PAD * 2, 2)) {
    ctx.fillText(line, PAD, y)
    y += 128
  }

  ctx.font = font(600, 38)
  ctx.fillStyle = "rgba(255,255,255,0.86)"
  y += 10
  for (const line of wrapChars(ctx, archetype.summary, W - PAD * 2, 3)) {
    ctx.fillText(line, PAD, y)
    y += 56
  }

  // 최근 결과 원 10개
  ctx.font = font(600, 32)
  ctx.fillStyle = "rgba(255,255,255,0.72)"
  ctx.fillText("최근 결과", PAD, 930)
  const r = 24
  for (let i = 0; i < 10; i++) {
    const cx = PAD + r + i * 66
    const cy = 995
    const form = dna.recentForm[i]
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    if (form === "W") {
      ctx.fillStyle = "#fff"
      ctx.fill()
    } else {
      ctx.lineWidth = 4
      ctx.strokeStyle =
        form === "L" ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.18)"
      ctx.stroke()
    }
  }

  // 구분선 + 지표 3칸
  ctx.fillStyle = "rgba(255,255,255,0.25)"
  ctx.fillRect(PAD, 1060, W - PAD * 2, 2)
  const stats = isWrapped
    ? [
        { value: `${wrapped.total}`, label: "예측 수" },
        {
          value: wrapped.accuracy == null ? "-" : `${wrapped.accuracy}%`,
          label: "적중률",
        },
        {
          value: wrapped.bestDelta == null ? "-" : `+${wrapped.bestDelta}`,
          label: "최고 수익",
        },
      ]
    : [
        {
          value: dna.accuracy == null ? "-" : `${dna.accuracy}%`,
          label: "적중률",
        },
        { value: `${dna.minorityHits}회`, label: "소수 의견 적중" },
        {
          value: dna.bestHit ? `+${dna.bestHit.delta}` : "-",
          label: "최고 수익",
        },
      ]
  const colW = (W - PAD * 2) / 3
  stats.forEach((s, i) => {
    const x = PAD + colW * i
    ctx.fillStyle = "#fff"
    ctx.font = font(800, 76)
    ctx.fillText(s.value, x, 1160)
    ctx.fillStyle = "rgba(255,255,255,0.72)"
    ctx.font = font(600, 30)
    ctx.fillText(s.label, x, 1206)
  })

  ctx.font = font(600, 26)
  ctx.fillStyle = "rgba(255,255,255,0.6)"
  ctx.fillText(
    "투표 게임 · 신용도는 순위 표시용이며 현금화할 수 없어요",
    PAD,
    1290,
  )

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("이미지를 만들지 못했어요")),
      "image/png",
    ),
  )
}

/**
 * 공유 시트가 파일 공유를 지원하면 공유하고, 아니면 PNG로 저장한다.
 * 반환값 "saved"는 파일로 저장했다는 뜻(호출부가 "공유 카드를 저장했어요" 토스트를 띄운다).
 */
export async function shareOrDownload(
  blob: Blob,
  filename: string,
): Promise<"shared" | "saved"> {
  const file = new File([blob], filename, { type: "image/png" })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) throw e
    }
    return "shared"
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return "saved"
}
