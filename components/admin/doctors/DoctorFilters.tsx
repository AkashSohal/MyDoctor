'use client'

import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

export type DoctorFilterOption = { id: string; name: string }

export function DoctorFilters({
  specialties,
  hospitals,
  values,
}: {
  specialties: DoctorFilterOption[]
  hospitals: DoctorFilterOption[]
  values: { q?: string; status?: string; specialty?: string; hospital?: string }
}) {
  const router = useRouter()

  const submit = (formData: FormData) => {
    const params = new URLSearchParams()
    Array.from(formData.entries()).forEach(([key, value]) => {
      if (typeof value === 'string' && value.trim()) params.set(key, value.trim())
    })
    router.push(`/admin/doctors?${params.toString()}`)
  }

  const hasFilters = Boolean(values.q || values.status || values.specialty || values.hospital)

  return (
    <form action={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Input
        name="q"
        defaultValue={values.q ?? ''}
        placeholder="Search name, email, reg. no…"
        leftIcon={<Search className="h-4 w-4" />}
      />
      <Select name="status" defaultValue={values.status ?? ''}>
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="verified">Verified</option>
        <option value="rejected">Rejected</option>
        <option value="suspended">Suspended</option>
      </Select>
      <Select name="specialty" defaultValue={values.specialty ?? ''}>
        <option value="">All specialties</option>
        {specialties.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>
      <Select name="hospital" defaultValue={values.hospital ?? ''}>
        <option value="">All hospitals</option>
        {hospitals.map((h) => (
          <option key={h.id} value={h.id}>
            {h.name}
          </option>
        ))}
      </Select>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Apply
        </Button>
        {hasFilters && (
          <Button type="button" variant="outline" onClick={() => router.push('/admin/doctors')}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  )
}
