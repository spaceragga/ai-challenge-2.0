export function StarIcon({ className = 'w-[18px] h-[18px]' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.9 6.9 7.5.6-5.7 4.9 1.7 7.3L12 18.8 5.6 21.7l1.7-7.3L1.6 9.5l7.5-.6L12 2z" />
    </svg>
  )
}

export function SearchIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  )
}

export function ChevronDownIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChevronUpIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function EducationIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M12 3L2 8l10 5 10-5-10-5z" />
      <path d="M6 10v5c0 2 3 4 6 4s6-2 6-4v-5" />
    </svg>
  )
}

export function SpeakingIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="8" width="12" height="10" rx="1" />
      <path d="M15 11h2a3 3 0 010 6h-2" />
      <path d="M7 18v3M11 18v3" />
    </svg>
  )
}

export function UniversityIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M3 10l9-5 9 5-9 5-9-5z" />
      <path d="M6 12v5c0 1.5 2.5 3 6 3s6-1.5 6-3v-5" />
      <path d="M21 10v6" />
    </svg>
  )
}

export function CategoryIcon({ type }: { type: 'education' | 'speaking' | 'university' }) {
  if (type === 'education') return <EducationIcon />
  if (type === 'speaking') return <SpeakingIcon />
  return <UniversityIcon />
}
