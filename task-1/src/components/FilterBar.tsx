import type { Filters } from '../types'
import { CATEGORIES } from '../data/categories'
import { SearchIcon } from './icons'

interface Props {
  filters: Filters
  onChange: (next: Filters) => void
  availableYears: number[]
}

export function FilterBar({ filters, onChange, availableYears }: Props) {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <Select
        ariaLabel="Filter by year"
        value={filters.year === 'all' ? 'all' : String(filters.year)}
        onChange={(v) => onChange({ ...filters, year: v === 'all' ? 'all' : Number(v) })}
        options={[
          { value: 'all', label: 'All Years' },
          ...availableYears.map((y) => ({ value: String(y), label: String(y) })),
        ]}
        width="w-[120px]"
      />
      <Select
        ariaLabel="Filter by quarter"
        value={filters.quarter === 'all' ? 'all' : String(filters.quarter)}
        onChange={(v) =>
          onChange({
            ...filters,
            quarter: v === 'all' ? 'all' : (Number(v) as 1 | 2 | 3 | 4),
          })
        }
        options={[
          { value: 'all', label: 'All Quarters' },
          { value: '1', label: 'Q1' },
          { value: '2', label: 'Q2' },
          { value: '3', label: 'Q3' },
          { value: '4', label: 'Q4' },
        ]}
        width="w-[120px]"
      />
      <Select
        ariaLabel="Filter by category"
        value={filters.category}
        onChange={(v) => onChange({ ...filters, category: v as Filters['category'] })}
        options={[
          { value: 'all', label: 'All Categories' },
          ...CATEGORIES.map((c) => ({ value: c.id, label: c.label })),
        ]}
        width="w-[150px]"
      />
      <div className="relative min-w-[200px] flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <SearchIcon />
        </span>
        <input
          type="search"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search employee..."
          aria-label="Search employee"
          className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
        />
      </div>
    </div>
  )
}

interface SelectProps {
  ariaLabel: string
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
  width: string
}

function Select({ ariaLabel, value, onChange, options, width }: SelectProps) {
  return (
    <div className={`relative ${width}`}>
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer appearance-none rounded-md border border-slate-200 bg-white px-3 py-2 pr-8 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
        <svg width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
          <path
            d="M1 1l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  )
}
