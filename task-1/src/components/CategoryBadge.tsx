import type { CategoryId } from '../types'
import { CATEGORY_BY_ID } from '../data/categories'

export function CategoryBadge({ categoryId }: { categoryId: CategoryId }) {
  const category = CATEGORY_BY_ID[categoryId]
  return (
    <span className="inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
      {category.label}
    </span>
  )
}
