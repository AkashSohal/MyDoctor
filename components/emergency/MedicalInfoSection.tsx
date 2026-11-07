'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  HeartPulse,
  Loader2,
  LogIn,
  Save,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { BLOOD_GROUPS } from '@/lib/emergency/storage'
import {
  PROFILE_LIMITS,
  validateEmergencyProfile,
  type EmergencyProfile,
  type EmergencyProfileErrors,
} from '@/lib/emergency/profile'
import type { UseEmergencyProfileResult } from '@/lib/emergency/useEmergencyProfile'
import { toast } from 'sonner'

type MedicalInfoApi = UseEmergencyProfileResult

/**
 * TASK 1 — "My Emergency Medical Information".
 *
 * Logged-in patients add, edit, update and delete their private emergency
 * medical profile (stored in Supabase, own-row RLS). Signed-out visitors see
 * exactly which fields are collected and are sent to the login screen.
 */
export function MedicalInfoSection({
  profile,
  loaded,
  saving,
  exists,
  isAuthenticated,
  loadError,
  saveProfile,
  deleteProfile,
}: MedicalInfoApi) {
  const [form, setForm] = React.useState<EmergencyProfile>(profile)
  const [errors, setErrors] = React.useState<EmergencyProfileErrors>({})
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  React.useEffect(() => {
    if (loaded) {
      setForm(profile)
      setErrors({})
    }
  }, [loaded, profile])

  const update = (key: keyof EmergencyProfile, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }))
    setErrors((previous) => ({ ...previous, [key]: undefined }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!isAuthenticated) {
      toast.error('Sign in to save your emergency medical information.')
      return
    }

    const localErrors = validateEmergencyProfile(form)
    setErrors(localErrors)
    if (Object.keys(localErrors).length > 0) {
      toast.error('Please fix the highlighted fields.')
      return
    }

    const result = await saveProfile(form)
    if (!result.ok) {
      if (result.errors) {
        setErrors(result.errors)
        toast.error('Please fix the highlighted fields.')
      } else {
        toast.error(result.error ?? 'Could not save your information.')
      }
      return
    }
    toast.success(
      exists
        ? 'Emergency medical information updated'
        : 'Emergency medical information saved to your account'
    )
  }

  const handleDelete = async () => {
    const result = await deleteProfile()
    setConfirmDelete(false)
    if (!result.ok) {
      toast.error(result.error ?? 'Could not delete your information.')
      return
    }
    toast.success('Saved emergency medical information deleted')
  }

  const busy = saving || !loaded

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        {/* Sign-in gate — shown instead of the form for visitors */}
        {!isAuthenticated && loaded && (
          <div className="mb-4 rounded-2xl border border-primary-200 bg-primary-50 p-5">
            <h3 className="flex items-center gap-2 text-base font-semibold text-primary-900">
              <LogIn className="h-5 w-5" aria-hidden="true" />
              Sign in to save your emergency medical information
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-primary-800/90">
              Your medical details are stored securely against your MyDoctor account — never
              publicly — and follow you to any device. Nothing below is saved while you are
              signed out.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Button asChild className="gap-2">
                <Link href="/auth/login?redirect=/emergency">
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  Sign in to save
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link href="/auth/register?role=patient">Create an account</Link>
              </Button>
            </div>
          </div>
        )}

        {loadError && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
          >
            <AlertCircle className="mt-0.5 h-4 w-5 shrink-0" aria-hidden="true" />
            <span>{loadError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-2xl border border-secondary-200 bg-white p-5 sm:p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold text-secondary-900">
            <HeartPulse className="h-5 w-5 text-red-600" aria-hidden="true" />
            My emergency medical information
          </h3>
          <p className="mt-1 text-sm text-secondary-500">
            Keep it short and current — this is what a responder needs to know first.
          </p>

          {!loaded ? (
            <div className="mt-5 space-y-3" aria-hidden="true">
              <div className="h-10 animate-pulse rounded-xl bg-secondary-100" />
              <div className="h-10 animate-pulse rounded-xl bg-secondary-100" />
              <div className="h-10 animate-pulse rounded-xl bg-secondary-100" />
            </div>
          ) : (
            <>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Input
                  label="Full name"
                  value={form.full_name}
                  onChange={(event) => update('full_name', event.target.value)}
                  placeholder="e.g. Priya Sharma"
                  maxLength={PROFILE_LIMITS.fullName}
                  autoComplete="name"
                  disabled={!isAuthenticated}
                  error={errors.full_name}
                  required
                />
                <Select
                  label="Blood group"
                  value={form.blood_group}
                  onChange={(event) => update('blood_group', event.target.value)}
                  disabled={!isAuthenticated}
                  error={errors.blood_group}
                >
                  <option value="">Unknown / not specified</option>
                  {BLOOD_GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Known allergies"
                  value={form.allergies}
                  onChange={(event) => update('allergies', event.target.value)}
                  placeholder="e.g. Penicillin, peanuts"
                  disabled={!isAuthenticated}
                  error={errors.allergies}
                />
                <Input
                  label="Current medications"
                  value={form.medications}
                  onChange={(event) => update('medications', event.target.value)}
                  placeholder="e.g. Metformin 500mg"
                  disabled={!isAuthenticated}
                  error={errors.medications}
                />
                <Input
                  label="Existing medical conditions"
                  value={form.conditions}
                  onChange={(event) => update('conditions', event.target.value)}
                  placeholder="e.g. Diabetes, asthma, hypertension"
                  disabled={!isAuthenticated}
                  error={errors.conditions}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Emergency contact"
                    value={form.emergency_contact_name}
                    onChange={(event) => update('emergency_contact_name', event.target.value)}
                    placeholder="Name"
                    maxLength={PROFILE_LIMITS.contactName}
                    disabled={!isAuthenticated}
                    error={errors.emergency_contact_name}
                  />
                  <Input
                    label="Contact number"
                    type="tel"
                    inputMode="tel"
                    value={form.emergency_contact_number}
                    onChange={(event) => update('emergency_contact_number', event.target.value)}
                    placeholder="9876543210"
                    disabled={!isAuthenticated}
                    error={errors.emergency_contact_number}
                  />
                </div>
              </div>

              <div className="mt-4">
                <Textarea
                  label="Additional important medical information"
                  rows={3}
                  value={form.additional_info}
                  onChange={(event) => update('additional_info', event.target.value)}
                  placeholder="e.g. pacemaker fitted 2022, preferred hospital, family doctor contact"
                  maxLength={PROFILE_LIMITS.longText}
                  disabled={!isAuthenticated}
                  error={errors.additional_info}
                />
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button type="submit" className="gap-2" disabled={!isAuthenticated || busy}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Save className="h-4 w-4" aria-hidden="true" />
                  )}
                  {saving ? 'Saving…' : exists ? 'Update information' : 'Save information'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 text-secondary-600"
                  onClick={() => setConfirmDelete(true)}
                  disabled={!isAuthenticated || !exists || busy}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete saved information
                </Button>
              </div>
            </>
          )}
        </form>
      </div>

      <aside className="lg:col-span-2">
        <div className="rounded-2xl border border-primary-200 bg-primary-50/70 p-5 sm:p-6">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-primary-800">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            Privacy
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-primary-900/80">
            <li>Stored in your private Supabase account row — readable only by you.</li>
            <li>Row Level Security blocks every other signed-in user and all anonymous visitors.</li>
            <li>Never shown publicly, never used for appointments or search.</li>
            <li>
              Only the fields you tick are ever copied into a shareable medical ID — and you can
              revoke that share at any time.
            </li>
            <li>Delete it whenever you want; it disappears immediately.</li>
          </ul>
        </div>
      </aside>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete saved medical information?"
        description="Your emergency medical profile will be permanently removed from your account. The digital medical ID shares based on it stop working too."
        confirmLabel="Delete"
        variant="destructive"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
