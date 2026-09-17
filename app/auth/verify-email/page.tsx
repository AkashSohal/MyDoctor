'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, CheckCircle, Loader2 } from 'lucide-react'

export default function VerifyEmailPage() {
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
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-6">
              <Mail className="h-8 w-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-secondary-900 mb-2">Check your email</h1>
            <p className="text-secondary-500 mb-6">
              We&apos;ve sent a verification link to your email address. 
              Please click the link to verify your account.
            </p>
            <div className="space-y-3">
              <Link href="/auth/login">
                <Button className="w-full" size="lg">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Go to Login
                </Button>
              </Link>
              <p className="text-sm text-secondary-400">
                Didn&apos;t receive the email? Check your spam folder or{' '}
                {resent ? (
                  <span className="text-green-600 font-medium">Email sent!</span>
                ) : email ? (
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="text-primary-600 hover:underline disabled:opacity-50"
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
                  <Link href="/auth/login" className="text-primary-600 hover:underline">sign in again</Link>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}