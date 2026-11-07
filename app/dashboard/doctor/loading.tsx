import { Skeleton } from '@/components/ui/skeleton'

export default function DoctorDashboardLoading() {
  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-teal-600">
        <div className="container py-8 sm:py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <Skeleton variant="circular" className="h-20 w-20 bg-white/20" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-7 w-56 bg-white/20" />
              <Skeleton className="h-4 w-72 bg-white/20" />
              <Skeleton className="h-8 w-40 bg-white/20" />
            </div>
          </div>
        </div>
      </div>
      <div className="container py-6">
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mb-6 h-14 w-full rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
