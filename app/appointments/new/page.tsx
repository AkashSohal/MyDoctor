import { Suspense } from 'react'
import { NewAppointmentContent } from './NewAppointmentContent'
import { DoctorListSkeleton } from '@/components/common/LoadingSkeleton'

export default function NewAppointmentPage() {
  return (
    <Suspense fallback={<DoctorListSkeleton count={1} />}>
      <NewAppointmentContent />
    </Suspense>
  )
}