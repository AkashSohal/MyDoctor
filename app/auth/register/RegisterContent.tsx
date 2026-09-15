'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/hooks/useAuth'
import { Mail, Lock, User, Phone, Eye, EyeOff, AlertCircle, Stethoscope, Building2 } from 'lucide-react'

type RegisterForm = {
  fullName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  role: 'patient' | 'doctor'
  terms: boolean
}

export function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signUp } = useAuth()
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  const role = (searchParams.get('role') as 'patient' | 'doctor') || 'patient'

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    defaultValues: { role, terms: false },
  })

  const password = watch('password')

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    setError('')
    
    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }
    
    const { error } = await signUp(data.email, data.password, data.fullName, data.role)
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/auth/verify-email')
      router.refresh()
    }
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
          <h1 className="text-2xl font-bold text-secondary-900">Create your account</h1>
          <p className="text-secondary-500 mt-2">Join MediNear as a {role === 'doctor' ? 'doctor' : 'patient'}</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Enter your details to create an account</CardDescription>
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
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  error={errors.fullName?.message}
                  {...register('fullName', {
                    required: 'Full name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  })}
                  leftIcon={<User className="h-5 w-5" />}
                  autoComplete="name"
                />
              </div>

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

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  error={errors.phone?.message}
                  {...register('phone', {
                    required: 'Phone number is required',
                    pattern: {
                      value: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
                      message: 'Invalid phone number',
                    },
                  })}
                  leftIcon={<Phone className="h-5 w-5" />}
                  autoComplete="tel"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  })}
                  leftIcon={<Lock className="h-5 w-5" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-secondary-400 hover:text-secondary-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  }
                  autoComplete="new-password"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match',
                  })}
                  leftIcon={<Lock className="h-5 w-5" />}
                  autoComplete="new-password"
                />
              </div>

              <div>
                <Label>Register as</Label>
                <Select
                  value={role}
                  onChange={(e) => router.push(`/auth/register?role=${e.target.value}`)}
                  disabled
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                </Select>
                <p className="text-xs text-secondary-500 mt-1">
                  {role === 'doctor' 
                    ? 'Doctor accounts require verification before going live' 
                    : 'Find and book appointments with verified doctors'}
                </p>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  {...register('terms', { required: 'You must accept the terms' })}
                  className="h-4 w-4 mt-0.5 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <Label htmlFor="terms" className="text-sm text-secondary-600 mt-0.5">
                  I agree to the{' '}
                  <Link href="/terms" className="text-primary-600 hover:underline">Terms of Service</Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>
                </Label>
              </div>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Create Account
              </Button>
            </form>

            <Separator>Or continue with</Separator>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => {}} disabled>
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
              <Button variant="outline" onClick={() => {}} disabled>
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.931.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </Button>
            </div>

            <p className="text-center text-sm text-secondary-500">
              Already have an account?{' '}
              <Link href={`/auth/login?role=${role}`} className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}