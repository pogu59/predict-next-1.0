type StatTileProps = {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  valueClassName?: string
}

/** 마이페이지 상단 통계 카드(총 참여/적중률/이번 주 참여)가 공유하는 타일. */
export function StatTile({ label, value, sub, valueClassName = "" }: StatTileProps) {
  return (
    <div className="border-line bg-card flex flex-1 flex-col gap-1.5 rounded-2xl border px-[17px] py-4">
      <span className="text-ink-subtle text-[11.5px] font-bold">{label}</span>
      <span className={`text-2xl leading-none font-extrabold tracking-[-0.04em] tabular-nums ${valueClassName}`}>
        {value}
      </span>
      {sub && <span className="text-ink-faint text-[11px] font-semibold tabular-nums">{sub}</span>}
    </div>
  )
}
