'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { createHospital, updateHospital } from '@/app/admin/actions'
import { ImageUploadField } from '@/components/admin/ImageUploadField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export type HospitalFormValue = {
  id?: string
  name: string
  address: string
  phone: string | null
  website: string | null
  email: string | null
  image_url: string | null
  latitude: number | null
  longitude: number | null
  facilities: string[]
  is_active: boolean
  specialty_ids: string[]
}

const emptyHospital: HospitalFormValue = {
  name: '',
  address: '',
  phone: null,
  website: null,
  email: null,
  image_url: null,
  latitude: null,
  longitude: null,
  facilities: [],
  is_active: true,
  specialty_ids: [],
}

export function HospitalForm({
  hospital,
  specialties,
  onClose,
}: {
  hospital?: HospitalFormValue
  specialties: { id: string; name: string }[]
  onClose?: () => void
}) {
  const router = useRouter()
  const editing = Boolean(hospital?.id)
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState<HospitalFormValue>(() =>
    hospital ? { ...hospital } : { ...emptyHospital }
  )

  const set = <K extends keyof HospitalFormValue>(key: K, value: HospitalFormValue[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.address.trim()) {
      toast.error('Name and address are required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        latitude: form.latitude,
        longitude: form.longitude,
      }
      const res = editing
        ? await updateHospital(form.id!, payload)
        : await createHospital(payload)
      if (res.ok) {
        toast.success(editing ? 'Hospital updated' : 'Hospital created')
        if (!editing) {
          router.push('/admin/hospitals')
        }
        router.refresh()
        onClose?.()
      } else {
        toast.error(res.error)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Name *" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        <Input
          label="Phone"
          value={form.phone ?? ''}
          onChange={(e) => set('phone', e.target.value || null)}
        />
      </div>
      <Textarea
        label="Address *"
        value={form.address}
        onChange={(e) => set('address', e.target.value)}
        rows={2}
        required
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Website"
          value={form.website ?? ''}
          onChange={(e) => set('website', e.target.value || null)}
        />
        <Input
          label="Email"
          type="email"
          value={form.email ?? ''}
          onChange={(e) => set('email', e.target.value || null)}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Latitude"
          type="number"
          step="any"
          value={form.latitude ?? ''}
          onChange={(e) => set('latitude', e.target.value === '' ? null : Number(e.target.value))}
        />
        <Input
          label="Longitude"
          type="number"
          step="any"
          value={form.longitude ?? ''}
          onChange={(e) => set('longitude', e.target.value === '' ? null : Number(e.target.value))}
        />
      </div>

      <div>
        <Label>Facilities (one per line)</Label>
        <Textarea
          value={form.facilities.join('\n')}
          onChange={(e) => set('facilities', e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
          rows={3}
          placeholder={'Emergency room\nICU\nParking'}
          className="mt-1.5"
        />
      </div>

      <div>
        <Label>Specialties</Label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {specialties.map((s) => {
            const selected = form.specialty_ids.includes(s.id)
            return (
              <button
                key={s.id}
                type="button"
                onClick={() =>
                  set(
                    'specialty_ids',
                    selected
                      ? form.specialty_ids.filter((id) => id !== s.id)
                      : [...form.specialty_ids, s.id]
                  )
                }
                className={
                  selected
                    ? 'rounded-full bg-primary-600 px-3 py-1 text-xs font-medium text-white'
                    : 'rounded-full border border-secondary-300 px-3 py-1 text-xs font-medium text-secondary-600 hover:border-primary-400'
                }
              >
                {s.name}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <ImageUploadField
          label="Hospital image"
          value={form.image_url}
          onChange={(url) => set('image_url', url)}
        />
        <label className="flex items-center gap-2 text-sm font-medium text-secondary-700">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => set('is_active', e.target.checked)}
            className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
          />
          Active (visible to patients)
        </label>
      </div>

      <div className="flex justify-end gap-2 border-t border-secondary-100 pt-4">
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose}>
            <X className="mr-1.5 h-4 w-4" /> Cancel
          </Button>
        )}
        <Button type="submit" loading={saving}>
          {editing ? 'Save changes' : 'Create hospital'}
        </Button>
      </div>
    </form>
  )
}
