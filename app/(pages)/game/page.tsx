"use client"

import { useEffect, useState } from "react"
import { ArrowDown, ArrowUp, RotateCcw, Trophy } from "lucide-react"

/**
 * 하이로우 미니게임 — 다음 카드가 지금 카드보다 높을지/낮을지 예측한다.
 * 카드는 매번 1~13(A~K) 중 균등하게 뽑으므로 확률이 낮은 쪽을 맞힐수록 점수를 더 준다.
 * 같은 숫자가 나오면 무승부로 연속 기록만 유지된다. 서버 신용도와는 무관한 순수 클라이언트 게임이고,
 * 최고 점수만 이 브라우저의 localStorage에 남긴다.
 */

const BEST_SCORE_KEY = "minigame_hilo_best"
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
const SUITS = [
  { symbol: "♠", red: false },
  { symbol: "♥", red: true },
  { symbol: "♦", red: true },
  { symbol: "♣", red: false },
]

type Card = { value: number; suit: number; id: number }
type Guess = "up" | "down"
type Outcome = "win" | "tie" | "lose"

let cardSeq = 0
function drawCard(): Card {
  return {
    value: Math.floor(Math.random() * 13) + 1,
    suit: Math.floor(Math.random() * 4),
    id: ++cardSeq,
  }
}

function probability(current: number, guess: Guess) {
  return guess === "up" ? (13 - current) / 13 : (current - 1) / 13
}

/** 확률이 낮을수록 점수가 커진다. 연속 적중 보너스는 5연속마다 +1배. */
function pointsFor(p: number, streak: number) {
  const base = Math.max(1, Math.round(5 / p))
  return base * (1 + Math.floor(streak / 5))
}

function readBest() {
  try {
    return Number(localStorage.getItem(BEST_SCORE_KEY)) || 0
  } catch {
    return 0
  }
}

function writeBest(score: number) {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(score))
  } catch {
    // 시크릿 모드 등에서 저장이 막혀도 게임은 계속된다.
  }
}

function PlayingCard({ card, size = "lg" }: { card: Card; size?: "lg" | "sm" }) {
  const suit = SUITS[card.suit]
  const rank = RANKS[card.value - 1]
  const color = suit.red ? "text-accent" : "text-bg"

  if (size === "sm") {
    return (
      <div
        className={`flex h-12 w-9 flex-none flex-col items-center justify-center rounded-md bg-ink text-label leading-none ${color}`}
      >
        <span>{rank}</span>
        <span>{suit.symbol}</span>
      </div>
    )
  }

  return (
    <div
      className={`relative flex h-52 w-36 animate-in flex-col justify-between rounded-2xl bg-ink p-3 shadow-2xl duration-300 fade-in zoom-in-90 sm:h-60 sm:w-40 ${color}`}
    >
      <span className="text-h2 leading-none">
        {rank}
        <br />
        {suit.symbol}
      </span>
      <span className="self-center text-[64px] leading-none">{suit.symbol}</span>
      <span className="rotate-180 text-h2 leading-none">
        {rank}
        <br />
        {suit.symbol}
      </span>
    </div>
  )
}

export default function GamePage() {
  const [current, setCurrent] = useState<Card | null>(null)
  const [history, setHistory] = useState<Card[]>([])
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const [last, setLast] = useState<{ outcome: Outcome; points: number } | null>(null)
  const [gameOver, setGameOver] = useState(false)

  // 첫 카드와 최고 점수는 랜덤/브라우저 저장소에 의존하므로 서버 렌더와 어긋나지 않게 마운트 후에 정한다.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrent(drawCard())
    setBest(readBest())
  }, [])

  function guess(dir: Guess) {
    if (!current || gameOver) return
    const p = probability(current.value, dir)
    const next = drawCard()
    const outcome: Outcome =
      next.value === current.value
        ? "tie"
        : (dir === "up") === next.value > current.value
          ? "win"
          : "lose"

    setHistory((h) => [current, ...h].slice(0, 8))
    setCurrent(next)

    if (outcome === "win") {
      const points = pointsFor(p, streak)
      const newScore = score + points
      setScore(newScore)
      setStreak(streak + 1)
      setLast({ outcome, points })
      if (newScore > best) {
        setBest(newScore)
        writeBest(newScore)
      }
    } else if (outcome === "tie") {
      setLast({ outcome, points: 0 })
    } else {
      setLast({ outcome, points: 0 })
      setGameOver(true)
    }
  }

  function restart() {
    setCurrent(drawCard())
    setHistory([])
    setScore(0)
    setStreak(0)
    setLast(null)
    setGameOver(false)
  }

  const upP = current ? probability(current.value, "up") : 0
  const downP = current ? probability(current.value, "down") : 0
  const multiplier = 1 + Math.floor(streak / 5)

  return (
    <div className="flex flex-col items-center gap-5 px-4 pt-8 pb-11 sm:px-6">
      <div className="flex w-full max-w-[760px] flex-col gap-5">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-2">
          <h1 className="text-h1">미니게임 · 하이로우</h1>
          <span className="text-caption text-ink-subtle">
            다음 카드가 높을지 낮을지 예측해보세요
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <Stat label="점수" value={score.toLocaleString()} accent />
          <Stat
            label="연속 적중"
            value={`${streak}`}
            sub={multiplier > 1 ? `보너스 x${multiplier}` : "5연속마다 보너스"}
          />
          <Stat
            label="최고 기록"
            value={best.toLocaleString()}
            icon={<Trophy size={14} className="text-void" />}
          />
        </div>

        <div className="flex flex-col items-center gap-6 rounded-2xl border border-line bg-card px-5 py-8">
          <div className="flex h-60 items-center justify-center sm:h-64">
            {current && <PlayingCard key={current.id} card={current} />}
          </div>

          <div className="h-6 text-center text-label" aria-live="polite">
            {last?.outcome === "win" && (
              <span className="text-accent">적중! +{last.points}점</span>
            )}
            {last?.outcome === "tie" && (
              <span className="text-void">같은 숫자 · 무승부, 기록은 유지돼요</span>
            )}
            {last?.outcome === "lose" && (
              <span className="text-wrong">아쉽게 빗나갔어요</span>
            )}
          </div>

          {gameOver ? (
            <div className="flex w-full max-w-sm flex-col items-center gap-3">
              <span className="text-title2 tabular-nums">
                최종 {score.toLocaleString()}점
              </span>
              {score > 0 && score >= best && (
                <span className="text-caption text-void">최고 기록 달성!</span>
              )}
              <button
                type="button"
                onClick={restart}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-label text-accent-ink transition-opacity hover:opacity-90"
              >
                <RotateCcw size={16} />
                다시 하기
              </button>
            </div>
          ) : (
            <div className="grid w-full max-w-sm grid-cols-2 gap-3">
              <GuessButton
                label="높다"
                icon={<ArrowUp size={18} />}
                p={upP}
                points={upP > 0 ? pointsFor(upP, streak) : 0}
                disabled={!current || upP === 0}
                onClick={() => guess("up")}
              />
              <GuessButton
                label="낮다"
                icon={<ArrowDown size={18} />}
                p={downP}
                points={downP > 0 ? pointsFor(downP, streak) : 0}
                disabled={!current || downP === 0}
                onClick={() => guess("down")}
              />
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-5">
            <span className="text-label text-ink-subtle">지난 카드</span>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {history.map((c) => (
                <PlayingCard key={c.id} card={c} size="sm" />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5 rounded-2xl border border-dashed border-line-strong p-5 text-caption text-ink-subtle">
          <span className="text-label text-ink-muted">게임 방법</span>
          <span>· 카드는 매번 A~K 중 무작위로 나와요. 확률이 낮은 쪽을 맞힐수록 점수가 커요.</span>
          <span>· 같은 숫자가 나오면 무승부로 넘어가고, 틀리면 게임이 끝나요.</span>
          <span>· 5연속 적중마다 점수 배율이 1씩 올라가요. 신용도에는 영향이 없어요.</span>
        </div>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string
  value: string
  sub?: string
  accent?: boolean
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-4">
      <span className="flex items-center gap-1 text-caption text-ink-subtle">
        {icon}
        {label}
      </span>
      <span
        className={`text-title2 tabular-nums ${accent ? "text-accent" : "text-ink"}`}
      >
        {value}
      </span>
      {sub && <span className="text-caption text-ink-faint">{sub}</span>}
    </div>
  )
}

function GuessButton({
  label,
  icon,
  p,
  points,
  disabled,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  p: number
  points: number
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-xl border border-line bg-control px-4 py-4 text-ink transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-35"
    >
      <span className="flex items-center gap-1.5 text-h3">
        {icon}
        {label}
      </span>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-track">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${Math.round(p * 100)}%` }}
        />
      </div>
      <span className="text-caption text-ink-subtle tabular-nums">
        확률 {Math.round(p * 100)}% · +{points}점
      </span>
    </button>
  )
}
