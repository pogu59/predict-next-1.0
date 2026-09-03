import { Button } from "@/components/ui/button"

type PaginationProps = {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

/** admin/page.tsx, admin/users/page.tsx가 공유하는 목록 하단 페이지네이션. */
export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2">
      <Button type="button" variant="outline" size="sm" disabled={page === 0} onClick={() => onChange(Math.max(0, page - 1))}>
        이전
      </Button>
      <span className="text-ink-subtle text-label tabular-nums">
        {page + 1} / {totalPages}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page + 1 >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        다음
      </Button>
    </div>
  )
}
