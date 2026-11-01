'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateAdminProfile } from '@/app/admin/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function SettingsProfileForm({
  profile,
}: {
  profile: { full_name: string; phone: string; email: string }
}) {
  const router = useRouter()
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState({ full_name: profile.full_name, phone: profile.phone })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      const res = await updateAdminProfile(form)
      if (res.ok) {
        toast.success('Profile updated')
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Email" value={profile.email} disabled hint="Contact an engineer to change the login email." />
      <Input
        label="Full name"
        value={form.full_name}
        onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
        required
      />
      <Input
        label="Phone"
        value={form.phone}
        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
      />
      <Button type="submit" loading={saving}>
        Save profile
      </Button>
    </form>
  )
}
