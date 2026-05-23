import type { ComputedUser } from '../types'
import { Avatar } from './Avatar'
import { TotalScore } from './TotalScore'

interface Props {
  user: ComputedUser
  rank: 1 | 2 | 3
}

const RANK_BADGE_BG: Record<1 | 2 | 3, string> = {
  1: 'bg-yellow-500',
  2: 'bg-slate-400',
  3: 'bg-amber-900',
}

const RANK_BLOCK: Record<1 | 2 | 3, string> = {
  1: 'h-44 bg-gradient-to-b from-amber-100 to-amber-200',
  2: 'h-32 bg-gradient-to-b from-slate-200 to-slate-300',
  3: 'h-32 bg-gradient-to-b from-slate-200 to-slate-300',
}

const AVATAR_RING: Record<1 | 2 | 3, string> = {
  1: 'ring-4 ring-yellow-400',
  2: '',
  3: '',
}

export function PodiumColumn({ user, rank }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="relative mb-3">
        <Avatar
          name={user.user.name}
          color={user.user.avatarColor}
          size={96}
          ringClass={AVATAR_RING[rank]}
        />
        <span
          className={`absolute -bottom-0.5 -right-0.5 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-slate-50 text-[11px] font-extrabold text-white ${RANK_BADGE_BG[rank]}`}
        >
          {rank}
        </span>
      </div>

      <p className="mb-0.5 text-center text-[15px] font-bold text-slate-900">{user.user.name}</p>
      <p className="mb-3 text-center text-xs text-slate-500">{user.user.role}</p>

      <div className="mb-0 rounded-full bg-slate-50 px-3 py-1.5">
        <TotalScore points={user.totalPoints} compact />
      </div>

      <div
        className={`mt-0 flex w-full items-center justify-center rounded-t-lg ${RANK_BLOCK[rank]}`}
      >
        <span className="select-none text-5xl font-black text-slate-900/20">{rank}</span>
      </div>
    </div>
  )
}
