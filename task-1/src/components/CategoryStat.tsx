import type { CategoryStat } from '../types'
import { CATEGORY_BY_ID } from '../data/categories'
import { CategoryIcon } from './icons'

export function CategoryStat({ stat }: { stat: CategoryStat }) {
  const category = CATEGORY_BY_ID[stat.category]

  return (
    <div className="flex flex-col items-center gap-0.5 text-slate-500" title={category.label}>
      <CategoryIcon type={category.iconType} />
      <span className="text-[11px] font-semibold text-slate-500">{stat.count}</span>
    </div>
  )
}
