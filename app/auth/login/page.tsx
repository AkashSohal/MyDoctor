import { Suspense } from 'react'
import { LoginContent } from './LoginContent'
import { DoctorListSkeleton } from '@/components/common/LoadingSkeleton'

export default function LoginPage() {
  return (
    <Suspense fallback={<DoctorListSkeleton count={1} />}>
      <LoginContent />
    </Suspense>
  )
}