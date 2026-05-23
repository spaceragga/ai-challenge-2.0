import type { Category } from '../types'

export const CATEGORIES: Category[] = [
  { id: 'education', label: 'Education', iconType: 'education' },
  { id: 'public-speaking', label: 'Public Speaking', iconType: 'speaking' },
  {
    id: 'university-partnerships',
    label: 'University Partnerships',
    iconType: 'university',
  },
]

export const CATEGORY_BY_ID = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<Category['id'], Category>
