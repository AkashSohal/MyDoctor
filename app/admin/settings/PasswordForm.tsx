'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { describeAuthError } from '@/lib/auth-errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function PasswordForm() {
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState({ password: '', confirm: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match')
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: form.password })
      if (error) {
        toast.error(describeAuthError(error, 'Could not update password'))
        return
      }
      toast.success('Password updated')
      setForm({ password: '', confirm: '' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="New password"
        type="password"
        autoComplete="new-password"
        value={form.password}
        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        hint="At least 8 characters."
        required
      />
      <Input
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        value={form.confirm}
        onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
        required
      />
      <Button type="submit" loading={saving}>
        Update password
      </Button>
    </form>
  )
}
