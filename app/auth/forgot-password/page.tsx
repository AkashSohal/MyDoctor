import { Suspense } from 'react'
import { ForgotPasswordContent } from './ForgotPasswordContent'

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  )
}
