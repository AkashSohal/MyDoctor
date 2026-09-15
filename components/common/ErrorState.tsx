'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, WifiOff, Server, Bug, Home } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  message?: string
  error?: Error | string
  onRetry?: () => void
  onGoHome?: () => void
  showDetails?: boolean
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an unexpected error. Please try again.',
  error,
  onRetry,
  onGoHome,
  showDetails = false,
  className,
}: ErrorStateProps) {
  const [showErrorDetails, setShowErrorDetails] = React.useState(false)

  const errorMessage = error instanceof Error ? error.message : error

  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertCircle className="h-10 w-10" />
      </div>
      <h3 className="mt-6 text-xl font-semibold text-secondary-900">{title}</h3>
      <p className="mt-2 text-secondary-500 max-w-md">{message}</p>
      
      {showDetails && errorMessage && (
        <details className="mt-4 w-full max-w-md text-left">
          <summary className="cursor-pointer text-sm text-secondary-500 hover:text-secondary-700">
            Show error details
          </summary>
          <pre className="mt-2 overflow-auto rounded-lg bg-secondary-100 p-3 text-xs text-secondary-700 max-h-40">
            {errorMessage}
          </pre>
        </details>
      )}

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        {onRetry && (
          <Button onClick={onRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
        {onGoHome && (
          <Button variant="outline" onClick={onGoHome} className="gap-2">
            <Home className="h-4 w-4" />
            Go Home
          </Button>
        )}
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4 text-center max-w-md">
        <div className="p-4 rounded-xl border border-secondary-200">
          <WifiOff className="mx-auto h-6 w-6 text-secondary-400" />
          <p className="mt-2 text-sm text-secondary-600">Check connection</p>
        </div>
        <div className="p-4 rounded-xl border border-secondary-200">
          <Server className="mx-auto h-6 w-6 text-secondary-400" />
          <p className="mt-2 text-sm text-secondary-600">Server issue</p>
        </div>
        <div className="p-4 rounded-xl border border-secondary-200">
          <Bug className="mx-auto h-6 w-6 text-secondary-400" />
          <p className="mt-2 text-sm text-secondary-600">Report bug</p>
        </div>
      </div>
    </div>
  )
}

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Connection lost"
      message="Please check your internet connection and try again."
      onRetry={onRetry}
    />
  )
}

export function ServerError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Server error"
      message="Our servers are having trouble. Please try again in a moment."
      onRetry={onRetry}
    />
  )
}

export function NotFoundError({ onGoHome }: { onGoHome?: () => void }) {
  return (
    <ErrorState
      title="Page not found"
      message="The page you're looking for doesn't exist or has been moved."
      onGoHome={onGoHome}
    />
  )
}

export function UnauthorizedError({ onGoHome }: { onGoHome?: () => void }) {
  return (
    <ErrorState
      title="Access denied"
      message="You don't have permission to access this page. Please log in or contact support."
      onGoHome={onGoHome}
    />
  )
}