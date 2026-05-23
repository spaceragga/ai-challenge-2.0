import type { ComputedUser, Filters, User } from '../types'
import { quarterOf, yearOf } from './dates'

export function computeUserUnderFilters(user: User, filters: Filters): ComputedUser {
  const filteredActivities = user.activities.filter((a) => {
    if (filters.year !== 'all' && yearOf(a.date) !== filters.year) return false
    if (filters.quarter !== 'all' && quarterOf(a.date) !== filters.quarter) return false
    if (filters.category !== 'all' && a.category !== filters.category) return false
    return true
  })

  const totalPoints = filteredActivities.reduce((sum, a) => sum + a.points, 0)

  const counts = new Map<string, number>()
  for (const a of filteredActivities) {
    counts.set(a.category, (counts.get(a.category) ?? 0) + 1)
  }

  return {
    user,
    totalPoints,
    categoryStats: Array.from(counts.entries()).map(([category, count]) => ({
      category: category as ComputedUser['categoryStats'][0]['category'],
      count,
    })),
    filteredActivities: [...filteredActivities].sort((a, b) => b.date.localeCompare(a.date)),
  }
}

export function passesSearch(name: string, search: string): boolean {
  const q = search.trim().toLowerCase()
  if (!q) return true
  return name.toLowerCase().includes(q)
}

export function compareForLeaderboard(a: ComputedUser, b: ComputedUser): number {
  if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
  return a.user.name.localeCompare(b.user.name)
}

export function uniqueYears(users: User[]): number[] {
  const years = new Set<number>()
  for (const u of users) {
    for (const a of u.activities) years.add(yearOf(a.date))
  }
  return Array.from(years).sort((a, b) => b - a)
}
