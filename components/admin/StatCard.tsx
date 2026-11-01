import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

type Tone = 'green' | 'blue' | 'amber' | 'red' | 'teal' | 'purple'

const toneStyles: Record<Tone, { icon: string; ring: string }> = {
  green: { icon: 'bg-primary-50 text-primary-600', ring: 'ring-primary-100' },
  blue: { icon: 'bg-blue-50 text-blue-600', ring: 'ring-blue-100' },
  amber: { icon: 'bg-amber-50 text-amber-600', ring: 'ring-amber-100' },
  red: { icon: 'bg-red-50 text-red-600', ring: 'ring-red-100' },
  teal: { icon: 'bg-teal-50 text-teal-600', ring: 'ring-teal-100' },
  purple: { icon: 'bg-purple-50 text-purple-600', ring: 'ring-purple-100' },
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'green',
  hint,
  className,
}: {
  label: string
  value: string | number
  icon: LucideIcon
  tone?: Tone
  hint?: string
  className?: string
}) {
  const styles = toneStyles[tone]
  return (
    <Card className={cn('transition-shadow hover:shadow-card-hover', className)}>
      <CardContent className="flex items-center gap-4 p-5">
        <span
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1',
            styles.icon,
            styles.ring
          )}
        >
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-secondary-500">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-secondary-900">{value}</p>
          {hint && <p className="mt-0.5 truncate text-xs text-secondary-400">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
