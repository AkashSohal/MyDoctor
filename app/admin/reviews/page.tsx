import * as React from 'react'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import {
  REVIEW_STATUS_LABELS,
  REPORT_STATUS_LABELS,
  formatDate,
  reviewStatusVariant,
} from '@/lib/admin/format'
import { ReviewActions } from './ReviewActions'
import { ReportsPanel } from './ReportsPanel'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/common/EmptyState'
import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'

export const dynamic = 'force-dynamic'

const TABS = [
  { key: 'all', label: 'All reviews' },
  { key: 'pending_moderation', label: 'Pending' },
  { key: 'published', label: 'Published' },
  { key: 'reported', label: 'Reported' },
  { key: 'hidden', label: 'Hidden' },
  { key: 'reports', label: 'Reports' },
] as const

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const { supabase } = await requireAdmin()
  const tab = TABS.some((t) => t.key === searchParams.tab) ? searchParams.tab! : 'all'

  const isReports = tab === 'reports'

  let query = supabase
    .from('reviews')
    .select(
      `id, rating, review_text, status, is_verified, created_at,
       doctor:doctors(id, full_name),
       patient:profiles(id, full_name)`
    )
    .order('created_at', { ascending: false })
    .limit(100)

  if (!isReports && tab !== 'all') query = query.eq('status', tab)

  const [{ data: reviews }, { data: reports }] = await Promise.all([
    isReports
      ? Promise.resolve({ data: [] })
      : query,
    isReports
      ? supabase
          .from('reports')
          .select(
            `id, reason, status, created_at,
             review:reviews(id, rating, review_text, status),
             reporter:profiles(full_name),
             doctor:doctors(full_name)`
          )
          .order('created_at', { ascending: false })
          .limit(100)
      : Promise.resolve({ data: null }),
  ])

  return (
    <div>
      <PageHeader
        title="Reviews"
        description="Moderate patient reviews and handle reported content. Ratings themselves cannot be edited."
      />

      <div className="mb-6 flex flex-wrap gap-1.5 border-b border-secondary-200">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/reviews?tab=${t.key}`}
            className={cn(
              'rounded-t-xl px-4 py-2.5 text-sm font-medium transition-colors',
              tab === t.key
                ? 'border-b-2 border-primary-600 bg-primary-50/60 text-primary-700'
                : 'text-secondary-500 hover:text-secondary-800'
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {isReports ? (
        <ReportsPanel reports={(reports ?? []) as any[]} />
      ) : (reviews ?? []).length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<Star className="h-8 w-8 text-secondary-400" />}
              title="No reviews"
              description="Reviews will appear here once patients rate their completed appointments."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(reviews as any[]).map((review) => (
            <Card key={review.id}>
              <CardContent className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={cn(
                              'h-4 w-4',
                              i <= review.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-secondary-200'
                            )}
                          />
                        ))}
                      </span>
                      <Badge variant={reviewStatusVariant(review.status)}>
                        {REVIEW_STATUS_LABELS[review.status] ?? review.status}
                      </Badge>
                      {review.is_verified && <Badge variant="info">Verified visit</Badge>}
                    </div>
                    <p className="mt-2 text-sm text-secondary-700">
                      {review.review_text || <span className="italic text-secondary-400">(no text)</span>}
                    </p>
                    <p className="mt-2 text-xs text-secondary-400">
                      By{' '}
                      <Link
                        href={review.patient ? `/admin/patients/${review.patient.id}` : '#'}
                        className="font-medium text-secondary-600 hover:text-primary-600"
                      >
                        {review.patient?.full_name ?? 'Unknown patient'}
                      </Link>{' '}
                      for{' '}
                      <Link
                        href={review.doctor ? `/admin/doctors/${review.doctor.id}` : '#'}
                        className="font-medium text-secondary-600 hover:text-primary-600"
                      >
                        {review.doctor?.full_name ?? 'Unknown doctor'}
                      </Link>{' '}
                      · {formatDate(review.created_at)}
                    </p>
                  </div>
                  <ReviewActions id={review.id} status={review.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
