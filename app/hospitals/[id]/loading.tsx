import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function HospitalDetailsLoading() {
  return (
    <div className="min-h-screen bg-secondary-50" role="status" aria-label="Loading hospital details">
      {/* Hero skeleton */}
      <div className="bg-gradient-to-br from-primary-700 to-teal-600">
        <div className="container py-8 sm:py-12">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <Skeleton variant="circular" className="h-24 w-24 bg-white/20" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-9 w-72 bg-white/20" />
              <Skeleton className="h-4 w-96 bg-white/20" />
              <Skeleton className="h-4 w-40 bg-white/20" />
            </div>
            <div className="space-y-3 sm:min-w-[240px]">
              <Skeleton className="h-11 w-full bg-white/20" />
              <Skeleton className="h-11 w-full bg-white/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="container py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-5 w-40" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-5 w-48" />
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} variant="rectangular" className="h-8 w-28" />
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-5 w-56" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-secondary-100">
                    <Skeleton variant="circular" className="h-16 w-16 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-full max-w-md" />
                    </div>
                    <Skeleton className="h-9 w-20 shrink-0" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-5 w-36" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} variant="rectangular" className="h-16 w-full" />
                ))}
              </CardContent>
            </Card>
            <Card className="border-0 shadow-card">
              <CardContent className="p-6 space-y-3">
                <Skeleton variant="rectangular" className="h-12 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
