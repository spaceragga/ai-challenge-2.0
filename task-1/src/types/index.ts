export type CategoryId = 'education' | 'public-speaking' | 'university-partnerships'

export interface Category {
  id: CategoryId
  label: string
  iconType: 'education' | 'speaking' | 'university'
}

export interface Activity {
  id: string
  name: string
  category: CategoryId
  date: string
  points: number
}

export interface User {
  id: string
  name: string
  role: string
  avatarColor: string
  activities: Activity[]
}

export interface Filters {
  year: 'all' | number
  quarter: 'all' | 1 | 2 | 3 | 4
  category: 'all' | CategoryId
  search: string
}

export interface CategoryStat {
  category: CategoryId
  count: number
}

export interface ComputedUser {
  user: User
  totalPoints: number
  categoryStats: CategoryStat[]
  filteredActivities: Activity[]
}
