import type { Activity } from '../types'
import { CategoryBadge } from './CategoryBadge'
import { formatActivityDate } from '../lib/dates'

export function ExpandedActivities({ activities }: { activities: Activity[] }) {
  return (
    <div className="px-6 pb-5 pt-4 bg-slate-50/80 border-t border-slate-100">
      <h4 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
        Recent Activity
      </h4>
      {activities.length === 0 ? (
        <p className="text-sm text-slate-500">No activities under the current filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[480px] w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="pb-2 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Activity
                </th>
                <th className="pb-2 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Category
                </th>
                <th className="pb-2 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Date
                </th>
                <th className="pb-2 text-right text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Points
                </th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2.5 pr-4 text-sm font-medium text-slate-900">{activity.name}</td>
                  <td className="py-2.5 pr-4">
                    <CategoryBadge categoryId={activity.category} />
                  </td>
                  <td className="py-2.5 pr-6 text-sm text-slate-500 whitespace-nowrap">
                    {formatActivityDate(activity.date)}
                  </td>
                  <td className="py-2.5 text-right text-sm font-bold text-sky-500 whitespace-nowrap">
                    +{activity.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
