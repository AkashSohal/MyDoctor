import { Suspense } from 'react'
import { RegisterContent } from './RegisterContent'
import { DoctorListSkeleton } from '@/components/common/LoadingSkeleton'

export default function RegisterPage() {
  return (
    <Suspense fallback={<DoctorListSkeleton count={1} />}>
      <RegisterContent />
    </Suspense>
  )
}