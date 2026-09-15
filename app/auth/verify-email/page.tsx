'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, CheckCircle } from 'lucide-react'

export default function VerifyEmailPage() {
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
                <button className="text-primary-600 hover:underline">resend</button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}