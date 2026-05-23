function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

interface Props {
  name: string
  color: string
  size?: number
  ringClass?: string
}

export function Avatar({ name, color, size = 50, ringClass = '' }: Props) {
  const textSize = size >= 90 ? 'text-2xl' : size >= 70 ? 'text-xl' : 'text-sm'

  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold text-slate-700 shrink-0 ${ringClass}`}
      style={{ width: size, height: size, backgroundColor: color }}
      aria-hidden="true"
    >
      <span className={textSize}>{initials(name)}</span>
    </div>
  )
}
