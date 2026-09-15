import { Suspense } from 'react'
import { DoctorsPageContent } from './DoctorsPageContent'
import { DoctorListSkeleton } from '@/components/common/LoadingSkeleton'

export default function DoctorsPage() {
  return (
    <Suspense fallback={<DoctorListSkeleton count={5} />}>
      <DoctorsPageContent />
    </Suspense>
  )
}