'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { updateDoctorProfile } from '@/app/admin/actions'
import { ImageUploadField } from '@/components/admin/ImageUploadField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export function DoctorEditDialog({
  doctor,
  specialties,
  onClose,
  onSaved,
}: {
  doctor: {
    id: string
    full_name: string
    photo_url: string | null
    bio: string | null
    qualifications: string[]
    languages: string[]
    specialization_id: string | null
    experience_years: number
    consultation_fee: number
    medical_registration_number: string
    registration_council: string
    gender: string | null
    address: string | null
  }
  specialties: { id: string; name: string }[]
  onClose: () => void
  onSaved: () => void
}) {
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState({
    full_name: doctor.full_name,
    photo_url: doctor.photo_url ?? '',
    bio: doctor.bio ?? '',
    qualifications: (doctor.qualifications ?? []).join(', '),
    languages: (doctor.languages ?? []).join(', '),
    specialization_id: doctor.specialization_id ?? '',
    experience_years: String(doctor.experience_years ?? 0),
    consultation_fee: String(doctor.consultation_fee ?? 0),
    medical_registration_number: doctor.medical_registration_number,
    registration_council: doctor.registration_council,
    gender: doctor.gender ?? '',
    address: doctor.address ?? '',
  })

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim()) {
      toast.error('Full name is required')
      return
    }
    if (!form.medical_registration_number.trim()) {
      toast.error('Medical registration number is required')
      return
    }
    setSaving(true)
    try {
      const res = await updateDoctorProfile(doctor.id, {
        ...form,
        specialization_id: form.specialization_id || null,
        gender: form.gender || null,
        qualifications: form.qualifications.split(',').map((s) => s.trim()).filter(Boolean),
        languages: form.languages.split(',').map((s) => s.trim()).filter(Boolean),
        consultation_fee: Number(form.consultation_fee) || 0,
        experience_years: Number(form.experience_years) || 0,
      })
      if (res.ok) {
        toast.success('Doctor profile updated')
        onSaved()
      } else {
        toast.error(res.error)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <div className="absolute inset-0 bg-secondary-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-secondary-900">Edit doctor profile</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-secondary-100" aria-label="Close">
            <X className="h-5 w-5 text-secondary-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Full name *" value={form.full_name} onChange={set('full_name')} required />
          <Select label="Specialization" value={form.specialization_id} onChange={set('specialization_id')}>
            <option value="">None</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <Input
            label="Medical registration number *"
            value={form.medical_registration_number}
            onChange={set('medical_registration_number')}
            required
          />
          <Input
            label="Registration council *"
            value={form.registration_council}
            onChange={set('registration_council')}
            required
          />
          <Input
            label="Experience (years)"
            type="number"
            min={0}
            value={form.experience_years}
            onChange={set('experience_years')}
          />
          <Input
            label="Consultation fee (₹)"
            type="number"
            min={0}
            value={form.consultation_fee}
            onChange={set('consultation_fee')}
          />
          <Select label="Gender" value={form.gender} onChange={set('gender')}>
            <option value="">Not specified</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Select>
          <Input label="Address" value={form.address} onChange={set('address')} />
          <div className="sm:col-span-2">
            <Textarea label="Bio" value={form.bio} onChange={set('bio')} rows={3} />
          </div>
          <Input
            label="Qualifications (comma separated)"
            value={form.qualifications}
            onChange={set('qualifications')}
          />
          <Input
            label="Languages (comma separated)"
            value={form.languages}
            onChange={set('languages')}
          />
          <div className="sm:col-span-2">
            <ImageUploadField
              label="Profile photo"
              value={form.photo_url || null}
              onChange={(url) => setForm((f) => ({ ...f, photo_url: url ?? '' }))}
            />
          </div>

          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
