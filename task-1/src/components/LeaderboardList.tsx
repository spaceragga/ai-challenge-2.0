import type { ComputedUser } from '../types'
import { UserRow } from './UserRow'

interface Props {
  users: ComputedUser[]
  expandedIds: Set<string>
  onToggle: (id: string) => void
}

export function LeaderboardList({ users, expandedIds, onToggle }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {users.map((user, index) => (
        <UserRow
          key={user.user.id}
          user={user}
          rank={index + 1}
          expanded={expandedIds.has(user.user.id)}
          onToggle={() => onToggle(user.user.id)}
        />
      ))}
    </div>
  )
}
