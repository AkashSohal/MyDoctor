'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Ban, CheckCircle2, Edit3, X } from 'lucide-react'
import { setPatientStatus, updatePatientProfile } from '@/app/admin/actions'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function PatientActions({
  patient,
}: {
  patient: { id: string; full_name: string; email: string; phone: string; status: string }
}) {
  const router = useRouter()
  const [confirmSuspend, setConfirmSuspend] = React.useState(false)
  const [editing, setEditing] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [form, setForm] = React.useState({
    full_name: patient.full_name,
    phone: patient.phone,
    email: patient.email,
  })

  const setStatus = async (status: string, reason: string) => {
    setBusy(true)
    try {
      const res = await setPatientStatus(patient.id, status, reason)
      if (res.ok) {
        toast.success(status === 'suspended' ? 'Patient suspended' : 'Patient reactivated')
        setConfirmSuspend(false)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } finally {
      setBusy(false)
    }
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await updatePatientProfile(patient.id, form)
      if (res.ok) {
        toast.success('Patient updated')
        setEditing(false)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {patient.status === 'suspended' ? (
          <Button onClick={() => setStatus('active', '')}>
            <CheckCircle2 className="mr-2 h-4 w-4" /> Reactivate account
          </Button>
        ) : (
          <Button variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => setConfirmSuspend(true)}>
            <Ban className="mr-2 h-4 w-4" /> Suspend account
          </Button>
        )}
        <Button variant="outline" onClick={() => setEditing((v) => !v)}>
          <Edit3 className="mr-2 h-4 w-4" /> Edit contact info
        </Button>
      </div>

      {editing && (
        <form onSubmit={saveProfile} className="mt-4 grid max-w-xl grid-cols-1 gap-4 rounded-2xl border border-secondary-200 bg-white p-5 sm:grid-cols-2">
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
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <div className="flex items-end gap-2 sm:col-span-2">
            <Button type="submit" loading={busy}>
              Save
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={confirmSuspend}
        title="Suspend patient account"
        description="The patient will no longer be able to sign in or book appointments. Existing records are preserved."
        variant="destructive"
        confirmLabel="Suspend"
        requireReason
        loading={busy}
        onCancel={() => setConfirmSuspend(false)}
        onConfirm={(reason) => setStatus('suspended', reason)}
      />
    </>
  )
}
