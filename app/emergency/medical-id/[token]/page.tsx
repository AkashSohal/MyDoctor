import { type Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { ArrowRight, Link2Off, Siren } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { EmergencyCallActions } from '@/components/emergency/CallButtons'
import { SharedMedicalIdCard } from '@/components/emergency/SharedMedicalIdCard'
import {
  SHARE_TOKEN_PATTERN,
  type MedicalIdSharePayload,
} from '@/lib/emergency/medicalIdShared'

/**
 * Public, limited-access viewer for a shared emergency medical ID (TASK 2).
 *
 * Security model:
 *   - the 48-hex token is the only credential (192 bits, unguessable),
 *   - Row Level Security lets anon read a share row ONLY while it is active,
 *   - the row itself contains a field-limited snapshot (DB CHECK allow-list),
 *   - revoked shares are deleted, so their tokens stop resolving instantly,
 *   - the page never selects or renders user ids, emails or any other column.
 */

export const metadata: Metadata = {
  title: 'Shared Emergency Medical ID | MyDoctor',
  description:
    'Read-only emergency medical information voluntarily shared by a MyDoctor patient. Not medical advice — call 112 in an emergency.',
  robots: 'noindex, nofollow',
}

interface SharedMedicalIdPageProps {
  params: { token: string }
}

function StatusCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-secondary-50 px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-secondary-200 bg-white p-8 text-center shadow-soft">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <Link2Off className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-lg font-bold text-secondary-900">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-secondary-600">{message}</p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <Button asChild className="gap-2">
            <Link href="/emergency">
              Go to Emergency Assistance
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <p className="text-xs text-secondary-500">
            In an emergency, call 112 — do not rely on this page.
          </p>
        </div>
      </div>
    </div>
  )
}

export default async function SharedMedicalIdPage({ params }: SharedMedicalIdPageProps) {
  const token = typeof params?.token === 'string' ? params.token.toLowerCase() : ''

  // Cheap shape check first: never query the database with junk input.
  if (!SHARE_TOKEN_PATTERN.test(token)) {
    return (
      <main className="min-h-screen bg-secondary-50">
        <StatusCard
          title="Invalid share link"
          message="This medical ID link is not valid. Ask the person who shared it to generate a new QR code."
        />
      </main>
    )
  }

  let payload: MedicalIdSharePayload | null = null
  let expiresAt: string | null = null
  let unavailable = false

  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data, error } = await supabase
      .from('emergency_medical_id_shares')
      .select('payload, expires_at')
      .eq('token', token)
      .maybeSingle()

    if (error) {
      console.error('[MyDoctor] Failed to load shared medical ID:', error)
      unavailable = true
    } else if (data) {
      payload = (data.payload ?? null) as MedicalIdSharePayload | null
      expiresAt = (data.expires_at as string) ?? null
    }
  } catch (error) {
    console.error('[MyDoctor] Failed to load shared medical ID:', error)
    unavailable = true
  }

  if (unavailable) {
    return (
      <main className="min-h-screen bg-secondary-50">
        <StatusCard
          title="Shared medical ID is unavailable"
          message="We could not load this shared medical ID right now. Please try again shortly, or call emergency services directly on 112."
        />
      </main>
    )
  }

  if (!payload || Object.keys(payload).length === 0) {
    // Missing, expired (RLS-filtered) or revoked (deleted) — same honest answer.
    return (
      <main className="min-h-screen bg-secondary-50">
        <StatusCard
          title="This share link no longer works"
          message="The share has expired or was revoked by the patient. Ask them to generate a new QR code if you still need it."
        />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-secondary-50 px-4 py-10 sm:py-14">
      <div className="container flex flex-col items-center gap-6">
        <SharedMedicalIdCard payload={payload} expiresAt={expiresAt} />

        <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-red-50 p-5">
          <p className="flex items-center gap-2 font-semibold text-red-900">
            <Siren className="h-5 w-5 shrink-0" aria-hidden="true" />
            Emergency?
          </p>
          <p className="mt-1 text-sm text-red-700">
            MyDoctor never places calls on its own — confirm to dial from your phone.
          </p>
          <EmergencyCallActions className="mt-4 grid gap-2.5" size="lg" />
        </div>

        <p className="max-w-lg text-center text-xs text-secondary-500">
          Powered by{' '}
          <Link href="/" className="font-medium text-primary-700 underline-offset-2 hover:underline">
            MyDoctor
          </Link>{' '}
          · This page contains only what the patient chose to share and is hidden from search
          engines.
        </p>
      </div>
    </main>
  )
}
