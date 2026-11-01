export type MonthBucket = { key: string; label: string }

export function lastNMonths(n: number, from = new Date()): MonthBucket[] {
  const buckets: MonthBucket[] = []
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1)
  for (let i = 0; i < n; i++) {
    buckets.unshift({
      key: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`,
      label: cursor.toLocaleDateString('en-IN', { month: 'short' }),
    })
    cursor.setMonth(cursor.getMonth() - 1)
  }
  return buckets
}

export function monthKeyOf(isoDate: string): string {
  const d = new Date(isoDate)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
