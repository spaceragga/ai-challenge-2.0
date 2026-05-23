const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function yearOf(isoDate: string): number {
  return Number(isoDate.slice(0, 4))
}

export function quarterOf(isoDate: string): 1 | 2 | 3 | 4 {
  const month = Number(isoDate.slice(5, 7))
  return (Math.ceil(month / 3) as 1 | 2 | 3 | 4)
}

export function formatActivityDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}-${MONTHS[Number(month) - 1]}-${year}`
}
