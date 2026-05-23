import type { ComputedUser } from '../types'
import { Avatar } from './Avatar'
import { CategoryStat } from './CategoryStat'
import { TotalScore } from './TotalScore'
import { ChevronDownIcon, ChevronUpIcon } from './icons'
import { ExpandedActivities } from './ExpandedActivities'

interface Props {
  user: ComputedUser
  rank: number
  expanded: boolean
  onToggle: () => void
}

export function UserRow({ user, rank, expanded, onToggle }: Props) {
  return (
    <article
      className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
        expanded ? 'border-sky-500' : 'border-slate-200'
      }`}
    >
      <div className="flex min-h-[95px] items-center px-[18px] py-3.5">
        <span className="mr-1 w-[34px] shrink-0 text-center text-base font-bold text-slate-400">
          {rank}
        </span>

        <Avatar name={user.user.name} color={user.user.avatarColor} size={50} />

        <div className="ml-3.5 min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-slate-900">{user.user.name}</p>
          <p className="truncate text-xs text-slate-500">{user.user.role}</p>
        </div>

        {user.categoryStats.length > 0 && (
          <div className="mr-5 flex shrink-0 items-center gap-[18px] text-sky-500">
            {user.categoryStats.map((stat) => (
              <CategoryStat key={stat.category} stat={stat} />
            ))}
          </div>
        )}

        <div className="mx-5 hidden h-[38px] w-px shrink-0 bg-slate-200 sm:block" />

        <div className="mr-3.5 hidden shrink-0 text-right sm:block">
          <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Total
          </p>
          <TotalScore points={user.totalPoints} />
        </div>

        <button
          type="button"
          aria-label={expanded ? 'Collapse' : 'Expand'}
          aria-expanded={expanded}
          onClick={onToggle}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
        >
          {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </button>
      </div>

      {expanded && <ExpandedActivities activities={user.filteredActivities} />}
    </article>
  )
}
