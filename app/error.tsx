'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ErrorState } from '@/components/common/ErrorState'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  React.useEffect(() => {
    console.error('[MyDoctor] Unhandled page error:', error)
  }, [error])

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <ErrorState
        title="Something went wrong"
        message="We hit an unexpected problem on this page. You can try again or go back home."
        onRetry={reset}
        onGoHome={() => router.push('/')}
        showDetails={process.env.NODE_ENV === 'development'}
      />
    </main>
  )
}
