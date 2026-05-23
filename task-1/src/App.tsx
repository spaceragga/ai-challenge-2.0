import { useMemo, useState } from 'react'
import { USERS } from './data/users'
import {
  compareForLeaderboard,
  computeUserUnderFilters,
  passesSearch,
  uniqueYears,
} from './lib/computed'
import type { Filters } from './types'
import { FilterBar } from './components/FilterBar'
import { Podium } from './components/Podium'
import { LeaderboardList } from './components/LeaderboardList'

const INITIAL_FILTERS: Filters = {
  year: 'all',
  quarter: 'all',
  category: 'all',
  search: '',
}

function App() {
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const availableYears = useMemo(() => uniqueYears(USERS), [])

  const ranked = useMemo(() => {
    return USERS.map((user) => computeUserUnderFilters(user, filters))
      .filter((entry) => passesSearch(entry.user.name, filters.search))
      .filter((entry) => entry.totalPoints > 0 || filters.search.trim().length > 0)
      .sort(compareForLeaderboard)
  }, [filters])

  const top3 = useMemo(() => ranked.slice(0, 3), [ranked])
  const showPodium = top3.length === 3 && !filters.search.trim()

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-[900px] px-6 py-10 pb-20">
        <header className="mb-5">
          <h1 className="text-[30px] font-bold tracking-tight text-slate-900">Leaderboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Top performers based on contributions and activity
          </p>
        </header>

        <FilterBar filters={filters} onChange={setFilters} availableYears={availableYears} />

        {ranked.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <h2 className="text-base font-semibold text-slate-600">No results found</h2>
            <p className="mt-2 text-sm text-slate-400">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <>
            {showPodium && <Podium top3={top3} />}
            <LeaderboardList
              users={ranked}
              expandedIds={expandedIds}
              onToggle={toggleExpand}
            />
          </>
        )}
      </main>
    </div>
  )
}

export default App
