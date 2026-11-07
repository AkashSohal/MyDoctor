'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar } from '@/components/ui/avatar'
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  LogOut,
  AlertCircle,
  Loader2,
  Home,
  Stethoscope,
} from 'lucide-react'

type ProfileRow = {
  id: string
  full_name: string | null
  phone: string | null
  role: string | null
  created_at: string | null
}

type ProfileStatus = 'idle' | 'loading' | 'ready' | 'missing' | 'error'

function formatDate(value?: string | null): string {
  if (!value) return 'Not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function AccountLoading({ label }: { label: string }) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="flex flex-col items-center gap-3 text-secondary-600">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" aria-hidden="true" />
        <p className="text-sm">{label}</p>
      </div>
    </main>
  )
}

function AccountSkeleton() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Skeleton variant="circular" className="h-14 w-14" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
          <Skeleton className="h-11 w-full" />
        </CardContent>
      </Card>
    </main>
  )
}

export default function AccountPage() {
  const router = useRouter()
  const { user, session, loading: authLoading, signOut } = useAuth()

  const [profile, setProfile] = React.useState<ProfileRow | null>(null)
  const [status, setStatus] = React.useState<ProfileStatus>('loading')
  const [reloadKey, setReloadKey] = React.useState(0)
  const [loggingOut, setLoggingOut] = React.useState(false)
  const [logoutError, setLogoutError] = React.useState('')

  const userId = session?.user.id

  React.useEffect(() => {
    if (authLoading) return
    if (!userId) {
      setProfile(null)
      setStatus('idle')
      return
    }

    let cancelled = false
    setStatus('loading')

    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, phone, role, created_at')
          .eq('id', userId)
          .maybeSingle()

        if (cancelled) return

        if (error) {
          console.error('Error loading account profile:', error)
          setStatus('error')
          return
        }

        if (!data) {
          setProfile(null)
          setStatus('missing')
          return
        }

        setProfile(data)
        setStatus('ready')
      } catch (error) {
        // Unexpected runtime/network failure: never stay on the skeleton.
        console.error('Error loading account profile:', error)
        if (!cancelled) setStatus('error')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authLoading, userId, reloadKey])

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    setLogoutError('')

    try {
      const { error } = await signOut()

      if (error) {
        console.error('Error signing out:', error)
        setLogoutError('We could not sign you out. Please try again.')
        setLoggingOut(false)
        return
      }

      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
      setLogoutError('We could not sign you out. Please try again.')
      setLoggingOut(false)
    }
  }

  if (authLoading) {
    return <AccountLoading label="Loading your account..." />
  }

  if (!session) {
    if (loggingOut) {
      return <AccountLoading label="Signing you out..." />
    }
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
              <User className="h-6 w-6" aria-hidden="true" />
            </div>
            <CardTitle className="mt-2">You are signed out</CardTitle>
            <CardDescription>
              Sign in to view and manage your MyDoctor account.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/auth/login">
              <Button className="w-full">Sign In</Button>
            </Link>
            <Link href="/" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              Back to homepage
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (status === 'loading') {
    return <AccountSkeleton />
  }

  const authUser = session.user
  const metadata = (authUser.user_metadata ?? {}) as Record<string, unknown>
  const metadataName =
    typeof metadata.full_name === 'string' && metadata.full_name ? metadata.full_name : null
  const metadataPhone =
    typeof metadata.phone === 'string' && metadata.phone ? metadata.phone : null

  const displayName = profile?.full_name || user?.full_name || metadataName || 'Not provided'
  const email = authUser.email || user?.email || 'Not provided'
  const phone = profile?.phone || user?.phone || metadataPhone || 'Not provided'
  const role = (profile?.role || user?.role || 'patient') as string
  const registeredAt = profile?.created_at || authUser.created_at || user?.created_at || null

  const roleVariant =
    role === 'admin' ? 'danger' : role === 'doctor' ? 'info' : 'success'
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1)

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-secondary-600 hover:text-secondary-900"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          Back to homepage
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar
                src={user?.avatar_url}
                fallback={displayName}
                size="lg"
                alt={displayName}
              />
              <div className="min-w-0">
                <CardTitle className="truncate">{displayName}</CardTitle>
                <CardDescription className="truncate">{email}</CardDescription>
              </div>
            </div>
            <Badge variant={roleVariant as 'danger' | 'info' | 'success'}>{roleLabel}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {status === 'error' && (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                We could not load your account details. Please try again.
              </span>
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 bg-white text-red-700 hover:bg-red-100"
                onClick={() => setReloadKey((key) => key + 1)}
              >
                Retry
              </Button>
            </div>
          )}

          {status === 'missing' && (
            <div
              role="status"
              className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span>
                Your profile record could not be found, so some details may be missing.
                Please contact support to complete your profile.
              </span>
            </div>
          )}

          <dl className="divide-y divide-secondary-100">
            <div className="flex items-start gap-3 py-4">
              <User className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-secondary-500">
                  Full name
                </dt>
                <dd className="break-words text-sm font-medium text-secondary-900">
                  {displayName}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3 py-4">
              <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-secondary-500">
                  Email address
                </dt>
                <dd className="break-words text-sm font-medium text-secondary-900">{email}</dd>
              </div>
            </div>

            <div className="flex items-start gap-3 py-4">
              <Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-secondary-500">
                  Phone number
                </dt>
                <dd className="break-words text-sm font-medium text-secondary-900">{phone}</dd>
              </div>
            </div>

            <div className="flex items-start gap-3 py-4">
              <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-secondary-500">
                  Account role
                </dt>
                <dd className="text-sm font-medium text-secondary-900">{roleLabel}</dd>
              </div>
            </div>

            <div className="flex items-start gap-3 py-4">
              <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-secondary-500">
                  Registered on
                </dt>
                <dd className="text-sm font-medium text-secondary-900">
                  {formatDate(registeredAt)}
                </dd>
              </div>
            </div>
          </dl>

          {role === 'doctor' && (
            <div className="rounded-xl border border-primary-100 bg-primary-50/60 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2">
                  <Stethoscope className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-secondary-900">Doctor profile</p>
                    <p className="text-sm text-secondary-600">
                      Edit your personal and professional details, and manage hospital affiliations.
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/doctor" className="shrink-0">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Open Doctor Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {logoutError && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {logoutError}
            </p>
          )}

          <Button
            variant="destructive"
            size="lg"
            className="w-full"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                Log Out
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
