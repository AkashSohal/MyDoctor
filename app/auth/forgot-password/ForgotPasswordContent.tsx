'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/hooks/useAuth'
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'

type ForgotPasswordForm = {
  email: string
}

export function ForgotPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { resetPassword } = useAuth()
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [sent, setSent] = React.useState(false)

  const role = searchParams.get('role') || 'patient'

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>()

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true)
    setError('')

    const { error } = await resetPassword(data.email)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center">
                <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-secondary-900">MediNear</span>
            </Link>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-secondary-900">Check your email</h2>
                <p className="text-sm text-secondary-500">
                  We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
                </p>
                <p className="text-xs text-secondary-400">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                <div className="pt-4">
                  <Link href={`/auth/login?role=${role}`}>
                    <Button variant="outline" className="w-full">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center">
              <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-secondary-900">MediNear</span>
          </Link>
          <h1 className="text-2xl font-bold text-secondary-900">Forgot password?</h1>
          <p className="text-secondary-500 mt-2">No worries, we'll send you reset instructions</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>Enter your email and we'll send you a link to reset your password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  leftIcon={<Mail className="h-5 w-5" />}
                  autoComplete="email"
                />
              </div>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Send Reset Link
              </Button>
            </form>

            <Link href={`/auth/login?role=${role}`} className="flex items-center justify-center gap-2 text-sm text-secondary-500 hover:text-secondary-700">
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
