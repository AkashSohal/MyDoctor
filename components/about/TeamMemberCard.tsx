import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type TeamMemberBadge = 'Team Leader' | 'Senior Guide'

export interface TeamMemberCardProps {
  name: string
  initials: string
  badge?: TeamMemberBadge
  featured?: boolean
  className?: string
}

const badgeStyles: Record<TeamMemberBadge, string> = {
  'Team Leader': 'bg-primary-100 text-primary-700 ring-1 ring-inset ring-primary-200',
  'Senior Guide':
    'bg-gradient-to-r from-primary-600 to-teal-600 text-white shadow-glow ring-1 ring-inset ring-primary-500/30',
}

export function TeamMemberCard({ name, initials, badge, featured = false, className }: TeamMemberCardProps) {
  const avatarSize = featured ? 'h-36 w-36' : 'h-28 w-28'
  const initialsSize = featured ? 'text-4xl' : 'text-2xl'

  return (
    <Card
      className={cn(
        'group relative h-full overflow-hidden text-center transition-all duration-300 ease-out',
        featured
          ? 'border-primary-200 bg-gradient-to-b from-white via-white to-primary-50/70 shadow-float ring-1 ring-primary-100 hover:-translate-y-2 hover:shadow-glow-lg hover:ring-primary-200'
          : 'hover:-translate-y-1.5 hover:border-primary-200 hover:shadow-card-hover',
        className
      )}
    >
      {featured ? (
        <div
          className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary-400 via-teal-500 to-primary-600"
          aria-hidden="true"
        />
      ) : null}

      <CardContent className={cn('flex h-full flex-col items-center', featured ? 'px-8 pb-8 pt-10' : 'p-8')}>
        <div className={cn('relative mb-6', avatarSize)}>
          <div
            className={cn(
              'absolute -inset-1 rounded-full bg-gradient-to-br from-primary-400 to-teal-500 opacity-0 blur-md transition-opacity duration-300',
              featured ? 'group-hover:opacity-50' : 'group-hover:opacity-40'
            )}
            aria-hidden="true"
          />
          <div
            className={cn(
              'relative flex items-center justify-center rounded-full p-[3px] transition-all duration-300',
              featured
                ? 'bg-gradient-to-br from-primary-300 via-teal-400 to-primary-600 shadow-glow ring-4 ring-primary-100/80 group-hover:scale-105 group-hover:shadow-glow-lg'
                : 'bg-gradient-to-br from-primary-500 via-primary-600 to-teal-500 shadow-glow group-hover:scale-105 group-hover:shadow-glow-lg',
              avatarSize
            )}
          >
            <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-white bg-white">
              <span
                className={cn(
                  'bg-gradient-to-br from-primary-600 to-secondary-900 bg-clip-text font-bold text-transparent',
                  initialsSize
                )}
                aria-hidden="true"
              >
                {initials}
              </span>
            </div>
          </div>
        </div>

        <h3
          className={cn(
            'mb-3 font-semibold leading-snug text-secondary-900 transition-colors duration-300 group-hover:text-primary-700',
            featured ? 'text-2xl font-bold tracking-tight' : 'text-lg'
          )}
        >
          {name}
        </h3>

        {badge ? (
          <span
            className={cn(
              'inline-flex items-center rounded-full font-semibold tracking-wide',
              featured ? 'px-4 py-1.5 text-sm' : 'px-3 py-1 text-xs',
              badgeStyles[badge]
            )}
          >
            {badge}
          </span>
        ) : (
          <div
            className="h-0.5 w-8 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-300 group-hover:w-12"
            aria-hidden="true"
          />
        )}
      </CardContent>
    </Card>
  )
}
