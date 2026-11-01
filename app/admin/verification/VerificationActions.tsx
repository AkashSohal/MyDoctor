'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, Eye, UserX } from 'lucide-react'
import { setDoctorVerification } from '@/app/admin/actions'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'

export function VerificationActions({
  doctorId,
  doctorName,
}: {
  doctorId: string
  doctorName: string
}) {
  const router = useRouter()
  const [action, setAction] = React.useState<'approve' | 'reject' | null>(null)
  const [busy, setBusy] = React.useState(false)

  const submit = async (status: string, reason: string) => {
    setBusy(true)
    try {
      const res = await setDoctorVerification(doctorId, status, reason)
      if (res.ok) {
        toast.success(
          status === 'verified' ? `${doctorName} approved` : `${doctorName} rejected`
        )
        setAction(null)
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
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button size="sm" onClick={() => setAction('approve')}>
          <CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve
        </Button>
        <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => setAction('reject')}>
          <UserX className="mr-1.5 h-4 w-4" /> Reject
        </Button>
        <Button size="sm" variant="ghost" onClick={() => router.push(`/admin/doctors/${doctorId}`)}>
          <Eye className="mr-1.5 h-4 w-4" /> Full profile
        </Button>
      </div>

      <ConfirmDialog
        open={action === 'approve'}
        title={`Approve ${doctorName}?`}
        description="Verify that the medical registration number and qualifications check out. Approved doctors become visible in search and can accept bookings."
        confirmLabel="Approve doctor"
        loading={busy}
        onCancel={() => setAction(null)}
        onConfirm={(reason) => submit('verified', reason)}
      />

      <ConfirmDialog
        open={action === 'reject'}
        title={`Reject ${doctorName}?`}
        description="The application will be marked rejected and the doctor stays hidden. The reason is stored in the audit log."
        variant="destructive"
        confirmLabel="Reject application"
        requireReason
        loading={busy}
        onCancel={() => setAction(null)}
        onConfirm={(reason) => submit('rejected', reason)}
      />
    </>
  )
}
