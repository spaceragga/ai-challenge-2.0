import { StarIcon } from './icons'

export function TotalScore({ points, compact = false }: { points: number; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-1 font-extrabold text-sky-500 ${compact ? 'text-base' : 'text-2xl'}`}>
      <StarIcon className={compact ? 'w-4 h-4' : 'w-[18px] h-[18px]'} />
      <span>{points}</span>
    </div>
  )
}
