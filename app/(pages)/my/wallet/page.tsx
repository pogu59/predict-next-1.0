"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { ChevronLeft, Info, X } from "lucide-react"

import type {
  RewardExchange,
  RewardProduct,
  RewardTransaction,
  RewardWallet,
} from "@/lib/api"
import { useNow } from "@/lib/issues"
import {
  dayLabel,
  EXCHANGE_STATUS,
  formatPoints,
  signedPoints,
  TRANSACTION_LABEL,
} from "@/lib/mission"
import { useMe } from "@/lib/queries/auth"
import {
  useCancelExchange,
  useRequestExchange,
  useWallet,
} from "@/lib/queries/reward"
import { cn } from "@/lib/utils"
import { PointCoin, ProductIcon } from "@/components/mission-parts"
import { ConfirmDialog } from "@/components/ui/overlay"
import { useToast } from "@/components/ui/toast"

/**
 * 리워드 포인트 지갑. 잔액·교환 확인 중·이번 달 적립 → 진행 중인 교환(취소) → 상품 → 내역.
 * 신용도는 여기 보여 주지 않는다(두 값을 나란히 두면 바꿀 수 있는 것처럼 보여서).
 */
export default function WalletPage() {
  const router = useRouter()
  const now = useNow(60_000)
  const { data: me, isLoading: meLoading } = useMe()
  const { data: wallet, error } = useWallet()
  const [product, setProduct] = useState<RewardProduct | null>(null)

  useEffect(() => {
    if (!meLoading && !me) router.replace("/login")
  }, [meLoading, me, router])

  if (!me) return null

  const header = (
    <header className="-mx-2 grid h-[60px] grid-cols-[44px_1fr_44px] items-center lg:mx-0 lg:flex lg:h-auto lg:pb-1">
      <Link
        href="/my"
        aria-label="마이로 돌아가기"
        className="grid size-11 place-items-center text-ink lg:hidden"
      >
        <ChevronLeft className="size-6" />
      </Link>
      <h1 className="text-center text-[17px] font-extrabold lg:text-left lg:text-[28px] lg:tracking-[-0.04em]">
        지갑
      </h1>
    </header>
  )

  if (error) {
    return (
      <div className="flex flex-col gap-3.5 px-4 pb-10">
        {header}
        <div className="py-16 text-center text-sm text-faint">
          {error.message}
        </div>
      </div>
    )
  }

  if (!wallet) {
    return (
      <div className="flex flex-col gap-3.5 px-4 pb-10">
        {header}
        <div className="h-[230px] animate-pulse rounded-[22px] bg-line-3" />
      </div>
    )
  }

  const requested = wallet.exchanges.filter((e) => e.status === "REQUESTED")
  const past = wallet.exchanges.filter((e) => e.status !== "REQUESTED")

  return (
    <div className="flex flex-col gap-3.5 px-4 pb-10 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-7 lg:p-0">
      <div className="flex flex-col gap-3.5 lg:sticky lg:top-[92px] lg:order-2">
        <div className="lg:hidden">{header}</div>
        <BalanceCard wallet={wallet} />
        <p className="flex gap-2 px-1 text-[13px] leading-normal font-medium text-sub">
          <Info className="mt-0.5 size-4 flex-none" />
          포인트는 미션으로 쌓이고 신용도와는 따로 관리돼요. 예측에는 쓸 수
          없어요.
        </p>
        {requested.length > 0 && (
          <PendingExchanges exchanges={requested} now={now} />
        )}
      </div>

      <div className="flex flex-col gap-3.5 lg:order-1">
        <div className="hidden lg:block">{header}</div>
        <section
          id="products"
          aria-labelledby="products-title"
          className="flex scroll-mt-4 flex-col gap-3"
        >
          <h2
            id="products-title"
            className="mx-1 mt-2 text-lg font-extrabold tracking-[-0.03em] lg:mt-0"
          >
            교환할 수 있는 상품
          </h2>
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {wallet.products.map((p) => (
              <ProductCard
                key={p.code}
                product={p}
                balance={wallet.balance}
                onPick={() => setProduct(p)}
              />
            ))}
          </div>
        </section>
        <History transactions={wallet.transactions} now={now} />
        {past.length > 0 && <PastExchanges exchanges={past} now={now} />}
      </div>

      {product && (
        <ExchangeSheet
          product={product}
          balance={wallet.balance}
          onClose={() => setProduct(null)}
        />
      )}
    </div>
  )
}

function BalanceCard({ wallet }: { wallet: RewardWallet }) {
  return (
    <section
      aria-label="내 포인트"
      className="flex flex-col gap-3.5 rounded-[22px] bg-ink p-[22px] text-white lg:rounded-3xl"
    >
      <div className="flex items-center gap-2">
        <PointCoin className="size-6" />
        <span className="text-sm font-bold text-white/80">내 포인트</span>
      </div>
      <span className="text-[40px] leading-none font-extrabold tracking-[-0.045em] tabular-nums">
        {formatPoints(wallet.balance)}
      </span>
      <div className="grid grid-cols-2 gap-2 tabular-nums">
        <span className="flex flex-col gap-0.5 rounded-xl bg-white/8 px-3 py-2.5">
          <span className="text-xs font-semibold text-white/75">
            교환 확인 중
          </span>
          <span className="text-[15px] font-extrabold">
            {formatPoints(wallet.pendingExchangePoints)}
          </span>
        </span>
        <span className="flex flex-col gap-0.5 rounded-xl bg-white/8 px-3 py-2.5">
          <span className="text-xs font-semibold text-white/75">
            이번 달 적립
          </span>
          <span className="text-[15px] font-extrabold">
            {formatPoints(wallet.monthEarned)}
          </span>
        </span>
      </div>
      <a
        href="#products"
        className="mt-1 flex h-[50px] items-center justify-center rounded-[14px] bg-surface text-base font-bold text-ink"
      >
        기프티콘으로 교환하기
      </a>
    </section>
  )
}

function ProductCard({
  product,
  balance,
  onPick,
}: {
  product: RewardProduct
  balance: number
  onPick: () => void
}) {
  const affordable = balance >= product.points
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={!affordable}
      aria-label={`${product.name} ${formatPoints(product.points)}${affordable ? ", 교환 가능" : `, ${formatPoints(product.points - balance)} 더 필요`}`}
      className={cn(
        "flex flex-col gap-2.5 rounded-[20px] border-2 bg-surface p-[14px] text-left text-ink",
        affordable ? "border-ink" : "cursor-default border-transparent",
      )}
    >
      <span
        className={cn(
          "grid size-10 place-items-center rounded-xl",
          affordable ? "bg-warn-soft text-warn-ink" : "bg-track text-sub",
        )}
      >
        <ProductIcon code={product.code} className="size-[22px]" />
      </span>
      <span className="text-[15px] font-bold">{product.name}</span>
      <span className="flex items-center justify-between gap-2">
        <span className="text-[15px] font-extrabold tabular-nums">
          {formatPoints(product.points)}
        </span>
        {affordable ? (
          <span className="text-xs font-bold text-success-ink">교환 가능</span>
        ) : (
          <span className="text-xs font-semibold text-sub tabular-nums">
            {formatPoints(product.points - balance)} 더
          </span>
        )}
      </span>
    </button>
  )
}

function PendingExchanges({
  exchanges,
  now,
}: {
  exchanges: RewardExchange[]
  now: Date
}) {
  const showToast = useToast()
  const cancel = useCancelExchange()
  const [target, setTarget] = useState<RewardExchange | null>(null)

  function doCancel() {
    if (!target) return
    cancel.mutate(target.id, {
      onSuccess: () => {
        setTarget(null)
        showToast(`${formatPoints(target.points)}를 돌려받았어요`)
      },
      onError: (e) => {
        setTarget(null)
        showToast(e.message)
      },
    })
  }

  return (
    <section
      aria-labelledby="pending-title"
      className="flex flex-col gap-3 rounded-[22px] bg-surface p-5 lg:rounded-3xl"
    >
      <h2 id="pending-title" className="text-base font-extrabold">
        진행 중인 교환
      </h2>
      {exchanges.map((e) => {
        return (
          <div
            key={e.id}
            className="flex flex-col gap-3 border-b border-line-3 pb-3 last:border-0 last:pb-0"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-11 flex-none place-items-center rounded-[14px] bg-track text-ink-2">
                <ProductIcon code={e.productCode} className="size-[22px]" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="text-[15px] font-bold">{e.productName}</span>
                <span className="text-[13px] font-medium text-sub tabular-nums">
                  {formatPoints(e.points)} · {dayLabel(e.createdAt, now)} 신청
                </span>
              </span>
              <span
                className={cn(
                  "rounded-xl px-2.5 py-[5px] text-[13px] font-extrabold",
                  EXCHANGE_STATUS.REQUESTED.className,
                )}
              >
                {EXCHANGE_STATUS.REQUESTED.label}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setTarget(e)}
              className="h-11 self-start rounded-xl bg-track px-4 text-sm font-bold text-ink-2"
            >
              신청 취소하기
            </button>
          </div>
        )
      })}
      <p className="rounded-[14px] bg-bg px-3.5 py-3 text-[13px] leading-normal font-medium text-ink-2">
        운영자가 확인한 뒤 1~2일 안에 보내드려요. 확인 전에는 신청을 취소할 수
        있어요.
      </p>
      <ConfirmDialog
        open={target !== null}
        onOpenChange={(open) => !open && setTarget(null)}
        title="교환 신청을 취소할까요?"
        description={
          target
            ? `${target.productName} 신청이 취소되고 ${formatPoints(target.points)}를 바로 돌려받아요.`
            : undefined
        }
        confirmLabel="신청 취소"
        loading={cancel.isPending}
        onConfirm={doCancel}
      />
    </section>
  )
}

function History({
  transactions,
  now,
}: {
  transactions: RewardTransaction[]
  now: Date
}) {
  const groups: { label: string; items: RewardTransaction[] }[] = []
  for (const t of transactions) {
    const label = dayLabel(t.createdAt, now)
    const group = groups[groups.length - 1]
    if (group && group.label === label) group.items.push(t)
    else groups.push({ label, items: [t] })
  }

  return (
    <section
      aria-labelledby="history-title"
      className="flex flex-col gap-1 rounded-[22px] bg-surface p-5 lg:rounded-3xl"
    >
      <h2 id="history-title" className="mb-2 text-base font-extrabold">
        적립·사용 내역
      </h2>
      {groups.length === 0 && (
        <span className="py-6 text-center text-sm text-sub">
          아직 내역이 없어요. 미션에 참여하면 여기에 쌓여요.
        </span>
      )}
      {groups.map((g, gi) => (
        <div key={`${g.label}-${gi}`} className="flex flex-col">
          <span
            className={cn(
              "pb-0.5 text-xs font-bold text-sub",
              gi === 0 ? "pt-1.5" : "pt-2.5",
            )}
          >
            {g.label}
          </span>
          {g.items.map((t, i) => (
            <div
              key={t.id}
              className={cn(
                "flex min-h-12 items-center justify-between gap-3 py-1.5",
                i > 0 && "border-t border-line-3",
              )}
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-[15px] font-semibold">
                  {t.memo ?? TRANSACTION_LABEL[t.type]}
                </span>
                <span className="text-xs font-medium text-sub">
                  {TRANSACTION_LABEL[t.type]}
                </span>
              </span>
              <span
                className={cn(
                  "flex-none text-[15px] font-extrabold tabular-nums",
                  t.amount > 0 ? "text-success-ink" : "text-ink",
                )}
              >
                {signedPoints(t.amount)}
              </span>
            </div>
          ))}
        </div>
      ))}
    </section>
  )
}

function PastExchanges({
  exchanges,
  now,
}: {
  exchanges: RewardExchange[]
  now: Date
}) {
  return (
    <section
      aria-labelledby="past-title"
      className="flex flex-col gap-1 rounded-[22px] bg-surface p-5 lg:rounded-3xl"
    >
      <h2 id="past-title" className="mb-2 text-base font-extrabold">
        지난 교환
      </h2>
      {exchanges.map((e, i) => {
        const chip = EXCHANGE_STATUS[e.status]
        return (
          <div
            key={e.id}
            className={cn(
              "flex flex-col gap-1 py-2.5",
              i > 0 && "border-t border-line-3",
            )}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="text-[15px] font-semibold">{e.productName}</span>
              <span
                className={cn(
                  "rounded-lg px-2 py-0.5 text-xs font-bold",
                  chip.className,
                )}
              >
                {chip.label}
              </span>
            </span>
            <span className="text-xs font-medium text-sub tabular-nums">
              {formatPoints(e.points)} ·{" "}
              {dayLabel(e.handledAt ?? e.createdAt, now)}
              {e.status === "REJECTED" && e.rejectReason
                ? ` · ${e.rejectReason}`
                : ""}
            </span>
          </div>
        )
      })}
    </section>
  )
}

/** 교환 신청 시트 — 모바일은 하단 시트, PC는 가운데 모달(overlay.tsx ActionSheet와 같은 틀). */
function ExchangeSheet({
  product,
  balance,
  onClose,
}: {
  product: RewardProduct
  balance: number
  onClose: () => void
}) {
  const showToast = useToast()
  const request = useRequestExchange()
  const [agreed, setAgreed] = useState(false)
  const after = balance - product.points

  function submit() {
    if (!agreed || request.isPending) return
    request.mutate(product.code, {
      onSuccess: () => {
        onClose()
        showToast("교환을 신청했어요")
      },
      onError: (e) => showToast(e.message),
    })
  }

  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(open) => !open && !request.isPending && onClose()}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-40 animate-fade-in bg-scrim" />
        <DialogPrimitive.Popup
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 flex animate-sheet-up flex-col gap-[18px] rounded-t-3xl bg-surface px-5 pt-3 pb-8 shadow-modal outline-none",
            "lg:inset-x-auto lg:top-1/2 lg:bottom-auto lg:left-1/2 lg:w-[420px] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:animate-pop lg:rounded-3xl lg:pt-6 lg:pb-6",
          )}
        >
          <span
            aria-hidden
            className="h-[5px] w-10 self-center rounded-full bg-line-2 lg:hidden"
          />
          <div className="flex items-center justify-between">
            <DialogPrimitive.Title className="text-[21px] font-extrabold tracking-[-0.04em]">
              교환 신청
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="닫기"
              className="-mr-2.5 grid size-11 place-items-center text-ink"
            >
              <X className="size-6" />
            </DialogPrimitive.Close>
          </div>
          <div className="flex items-center gap-3">
            <span className="grid size-12 flex-none place-items-center rounded-[14px] bg-warn-soft text-warn-ink">
              <ProductIcon code={product.code} className="size-6" />
            </span>
            <span className="flex flex-col gap-[3px]">
              <span className="text-base font-bold">{product.name}</span>
              <span className="text-[13px] font-medium text-sub">
                모바일 쿠폰
              </span>
            </span>
          </div>
          <dl className="flex flex-col gap-2.5 rounded-2xl bg-bg p-4 tabular-nums">
            <div className="flex justify-between text-sm font-semibold">
              <dt className="text-sub">보유 포인트</dt>
              <dd>{formatPoints(balance)}</dd>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <dt className="text-sub">교환에 쓰는 포인트</dt>
              <dd>{signedPoints(-product.points)}</dd>
            </div>
            <div className="h-px bg-line-2" />
            <div className="flex justify-between text-base font-extrabold">
              <dt>교환 후 남는 포인트</dt>
              <dd>{formatPoints(after)}</dd>
            </div>
          </dl>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-[14px] border-[1.5px] border-line-2 p-3.5 text-sm leading-normal font-medium text-ink-2">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-px size-5 flex-none accent-brand"
            />
            <span>
              운영자가 확인한 뒤 1~2일 안에 보내드려요. 확인 전에는 지갑에서
              취소할 수 있어요.
            </span>
          </label>
          <div className="grid grid-cols-[1fr_2fr] gap-2.5">
            <DialogPrimitive.Close
              disabled={request.isPending}
              className="h-[54px] rounded-[14px] bg-track text-base font-bold text-ink-2"
            >
              다음에
            </DialogPrimitive.Close>
            <button
              type="button"
              onClick={submit}
              disabled={!agreed || request.isPending}
              className="h-[54px] rounded-[14px] bg-brand text-base font-bold text-white hover:bg-brand-hover disabled:bg-disabled-bg disabled:text-sub"
            >
              {request.isPending ? "신청하는 중..." : "교환 신청하기"}
            </button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
