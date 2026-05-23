import type { ComputedUser } from '../types'
import { PodiumColumn } from './PodiumColumn'

interface Props {
  top3: ComputedUser[]
}

export function Podium({ top3 }: Props) {
  if (top3.length < 3) return null

  const order: Array<{ user: ComputedUser; rank: 1 | 2 | 3 }> = [
    { user: top3[1], rank: 2 },
    { user: top3[0], rank: 1 },
    { user: top3[2], rank: 3 },
  ]

  return (
    <div className="mb-6 flex items-end gap-2.5">
      {order.map(({ user, rank }) => (
        <PodiumColumn key={user.user.id} user={user} rank={rank} />
      ))}
    </div>
  )
}
