/**
 * 카테고리 아이콘/색상은 순수 UI 표현이며 백엔드(categories 테이블)에는 없는 값이라
 * 이름으로 매핑해 둔다. 백엔드는 정치/스포츠/E스포츠/경제/날씨 5개만 존재한다(schema.sql 1절).
 */
export type CategoryMeta = {
  icon: string
  color: string
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  정치: { icon: "how_to_vote", color: "var(--cat-politics)" },
  스포츠: { icon: "sports_soccer", color: "var(--cat-sports)" },
  E스포츠: { icon: "stadia_controller", color: "var(--cat-esports)" },
  경제: { icon: "monitoring", color: "var(--cat-econ)" },
  날씨: { icon: "rainy", color: "var(--cat-weather)" },
}

export const ALL_CATEGORY_META: CategoryMeta = { icon: "bolt", color: "var(--cat-all)" }

export function categoryMeta(name: string): CategoryMeta {
  return CATEGORY_META[name] ?? ALL_CATEGORY_META
}
