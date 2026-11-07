'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Building2, X } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  HOSPITAL_TYPES,
  emptyHospitalForm,
  findDuplicateHospital,
  friendlyHospitalError,
  validateHospitalForm,
  type HospitalListItem,
  type HospitalFormValues,
} from '@/lib/hospitals'

const supabase = createClient()

const INSERT_COLUMNS =
  'id, name, address, latitude, longitude, city, state, pin_code, hospital_type, verification_status, phone, website, email, added_by, created_at'

interface AddHospitalModalProps {
  open: boolean
  onClose: () => void
  /** Authenticated user id — every submission is attributed to them. */
  userId: string
  /** Already loaded hospitals, used for instant duplicate detection. */
  existingHospitals: Array<{ id?: string; name: string; address: string }>
  /** Called with the freshly inserted row so the caller can list + select it. */
  onCreated: (hospital: HospitalListItem) => void
  /** When provided the modal edits an existing (own, pending) facility. */
  hospital?: HospitalListItem | null
  /** Called after a successful edit. */
  onUpdated?: (hospital: HospitalListItem) => void
}

/**
 * Modal used during doctor onboarding and the doctor dashboard to submit a
 * new hospital/clinic (Part 1) or edit a pending submission (Part 2).
 * New submissions are stored with verification_status = 'pending' and
 * added_by = current user; the database enforces both rules.
 */
export function AddHospitalModal({
  open,
  onClose,
  userId,
  existingHospitals,
  onCreated,
  hospital,
  onUpdated,
}: AddHospitalModalProps) {
  const editing = Boolean(hospital?.id)
  const [form, setForm] = React.useState<HospitalFormValues>(emptyHospitalForm)
  const [error, setError] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      if (hospital) {
        setForm({
          name: hospital.name ?? '',
          hospital_type: (hospital.hospital_type as HospitalFormValues['hospital_type']) || 'Hospital',
          address: hospital.address ?? '',
          city: hospital.city ?? '',
          state: hospital.state ?? '',
          pin_code: hospital.pin_code ?? '',
          phone: hospital.phone ?? '',
          website: hospital.website ?? '',
        })
      } else {
        setForm(emptyHospitalForm)
      }
      setError('')
      setSaving(false)
    }
  }, [open, hospital])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, saving, onClose])

  if (!open) return null

  const set = <K extends keyof HospitalFormValues>(key: K, value: HospitalFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return

    const validationError = validateHospitalForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    const name = form.name.trim()
    const address = form.address.trim()

    // Ignore the facility being edited when checking for duplicates.
    const others = existingHospitals.filter((h) => !editing || h.id !== hospital?.id)
    if (findDuplicateHospital(others, name, address)) {
      setError('A hospital with this name and address already exists')
      return
    }

    setSaving(true)
    setError('')

    try {
      if (editing && hospital) {
        const { data, error: updateError } = await supabase
          .from('hospitals')
          .update({
            name,
            hospital_type: form.hospital_type,
            address,
            city: form.city.trim(),
            state: form.state.trim(),
            pin_code: form.pin_code.trim(),
            phone: form.phone.trim() || null,
            website: form.website.trim() || null,
          })
          .eq('id', hospital.id)
          .select(INSERT_COLUMNS)
          .single()

        if (updateError) throw updateError
        if (!data) {
          throw new Error('You can only edit pending facilities that you submitted')
        }

        toast.success('Hospital details updated', {
          description: 'Your changes are visible to the MyDoctor review team.',
        })
        onUpdated?.(data as HospitalListItem)
        onClose()
        return
      }

      const { data, error: insertError } = await supabase
        .from('hospitals')
        .insert({
          name,
          hospital_type: form.hospital_type,
          address,
          city: form.city.trim(),
          state: form.state.trim(),
          pin_code: form.pin_code.trim(),
          phone: form.phone.trim() || null,
          website: form.website.trim() || null,
          verification_status: 'pending',
          added_by: userId,
        })
        .select(INSERT_COLUMNS)
        .single()

      if (insertError) throw insertError
      if (!data) throw new Error('Hospital could not be saved')

      toast.success('Hospital added', {
        description: 'It will be listed once the MyDoctor team verifies it.',
      })
      onCreated(data as HospitalListItem)
      onClose()
    } catch (err) {
      const message = friendlyHospitalError(err)
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-secondary-900/50 backdrop-blur-sm" onClick={saving ? undefined : onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-hospital-title"
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-secondary-100 px-6 py-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
            <Building2 className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="add-hospital-title" className="text-lg font-bold text-secondary-900">
              {editing ? 'Edit Hospital / Clinic' : 'Add Hospital / Clinic'}
            </h2>
            <p className="mt-0.5 text-sm text-secondary-500">
              {editing
                ? 'You can update details while the facility is pending review.'
                : 'New facilities are reviewed by the MyDoctor team before going public.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="rounded-lg p-1.5 text-secondary-400 transition-colors hover:bg-secondary-100 hover:text-secondary-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="hospital-name">
                Hospital / Clinic Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="hospital-name"
                placeholder="e.g., Sunrise Clinic"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                disabled={saving}
                className="mt-1.5"
                maxLength={200}
              />
            </div>

            <div>
              <Label htmlFor="hospital-type">Hospital Type</Label>
              <Select
                id="hospital-type"
                value={form.hospital_type}
                onChange={(e) => set('hospital_type', e.target.value as HospitalFormValues['hospital_type'])}
                disabled={saving}
                className="mt-1.5"
              >
                {HOSPITAL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="hospital-address">
                Full Address <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="hospital-address"
                rows={2}
                placeholder="Street, area, landmark…"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                disabled={saving}
                className="mt-1.5"
                maxLength={500}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="hospital-city">
                  City <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="hospital-city"
                  placeholder="e.g., Bengaluru"
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  disabled={saving}
                  className="mt-1.5"
                  maxLength={100}
                />
              </div>
              <div>
                <Label htmlFor="hospital-state">
                  State <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="hospital-state"
                  placeholder="e.g., Karnataka"
                  value={form.state}
                  onChange={(e) => set('state', e.target.value)}
                  disabled={saving}
                  className="mt-1.5"
                  maxLength={100}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="hospital-pin">
                  PIN Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="hospital-pin"
                  placeholder="e.g., 560076"
                  inputMode="numeric"
                  value={form.pin_code}
                  onChange={(e) => set('pin_code', e.target.value.replace(/\D/g, ''))}
                  disabled={saving}
                  className="mt-1.5"
                  maxLength={6}
                />
              </div>
              <div>
                <Label htmlFor="hospital-phone">Contact Number</Label>
                <Input
                  id="hospital-phone"
                  placeholder="e.g., +91 80 1234 5678"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  disabled={saving}
                  className="mt-1.5"
                  maxLength={20}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="hospital-website">Website</Label>
              <Input
                id="hospital-website"
                placeholder="e.g., https://example.com"
                value={form.website}
                onChange={(e) => set('website', e.target.value)}
                disabled={saving}
                className="mt-1.5"
                maxLength={300}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-2 border-t border-secondary-100 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Save Hospital'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
