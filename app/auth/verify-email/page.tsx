'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, CheckCircle, Loader2, Shield } from 'lucide-react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const handleResend = async () => {
    if (!email) return
    setResending(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({ type: 'signup', email })
      if (!error) {
        setResent(true)
      }
    } catch {
      // silently fail
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center mx-auto mb-8 shadow-lg">
            <Mail className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-secondary-900 mb-3">Check your email</h1>
          <p className="text-secondary-500 mb-8 leading-relaxed">
            We&apos;ve sent a verification link to{' '}
            {email && <span className="font-semibold text-secondary-900">{email}</span>}
            {!email && <span className="font-semibold text-secondary-900">your email address</span>}. 
            <br />Please click the link to verify your account.
          </p>
          
          <div className="space-y-4">
            <Link href="/auth/login">
              <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-primary-600 to-teal-600 hover:from-primary-700 hover:to-teal-700 text-white font-semibold shadow-lg hover:shadow-glow transition-all duration-300">
                <CheckCircle className="h-5 w-5 mr-2" />
                Go to Login
              </Button>
            </Link>
            
            <p className="text-sm text-secondary-500">
              Didn&apos;t receive the email? Check your spam folder or{' '}
              {resent ? (
                <span className="text-green-600 font-medium">Email sent!</span>
              ) : email ? (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50 transition-colors"
                >
                  {resending ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Sending...
                    </span>
                  ) : (
                    'resend'
                  )}
                </button>
              ) : (
                <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">sign in again</Link>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-teal-600">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="absolute inset-0 bg-grid opacity-10" />
        </div>

        <div className="relative z-10 flex flex-col justify-center p-12 xl:p-16">
          <h2 className="text-4xl font-bold text-white mb-6">
            Almost There!
            <span className="block text-primary-200">Verify Your Email</span>
          </h2>
          <p className="text-primary-100 text-lg mb-10 leading-relaxed">
            Email verification helps us keep your account secure and ensures you receive important updates.
          </p>

          <div className="space-y-6">
            {[
              'Secure your account',
              'Receive appointment reminders',
              'Get personalized recommendations',
            ].map((text) => (
              <div key={text} className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <span className="text-white font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
