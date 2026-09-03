type Column<T> = {
  header: string
  render: (row: T) => React.ReactNode
  className?: string
}

type DataTableProps<T> = {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => React.Key
  onRowClick?: (row: T) => void
  loading: boolean
  emptyMessage: string
  minWidth?: string
}

/** admin/page.tsx, admin/users/page.tsx가 공유하는 목록 테이블(로딩/빈 상태 포함). */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  loading,
  emptyMessage,
  minWidth = "560px",
}: DataTableProps<T>) {
  return (
    <div className="border-line overflow-x-auto rounded-xl border">
      <table className="w-full text-left text-body" style={{ minWidth }}>
        <thead>
          <tr className="border-line text-ink-subtle border-b text-label">
            {columns.map((col) => (
              <th key={col.header} className="px-4 py-3">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="text-ink-subtle px-4 py-8 text-center text-label">
                불러오는 중...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-ink-subtle px-4 py-8 text-center text-label">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-line border-b last:border-b-0 ${onRowClick ? "hover:bg-card cursor-pointer" : ""}`}
              >
                {columns.map((col) => (
                  <td key={col.header} className={`px-4 py-3 ${col.className ?? ""}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
