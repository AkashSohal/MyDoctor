'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, XCircle } from 'lucide-react'
import { setHospitalVerification } from '@/app/admin/actions'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'

export function HospitalVerificationActions({
  hospitalId,
  hospitalName,
}: {
  hospitalId: string
  hospitalName: string
}) {
  const router = useRouter()
  const [action, setAction] = React.useState<'approve' | 'reject' | null>(null)
  const [busy, setBusy] = React.useState(false)

  const submit = async (status: string, reason: string) => {
    setBusy(true)
    try {
      const res = await setHospitalVerification(hospitalId, status, reason)
      if (res.ok) {
        toast.success(
          status === 'verified'
            ? `${hospitalName} verified`
            : `${hospitalName} rejected`
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
          <CheckCircle2 className="mr-1.5 h-4 w-4" /> Verify
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-red-600 hover:bg-red-50"
          onClick={() => setAction('reject')}
        >
          <XCircle className="mr-1.5 h-4 w-4" /> Reject
        </Button>
      </div>

      <ConfirmDialog
        open={action === 'approve'}
        title={`Verify ${hospitalName}?`}
        description="The facility receives a public Verified badge and appears as verified to patients. Confirm the address and contact details first."
        confirmLabel="Verify hospital"
        loading={busy}
        onCancel={() => setAction(null)}
        onConfirm={(reason) => submit('verified', reason)}
      />

      <ConfirmDialog
        open={action === 'reject'}
        title={`Reject ${hospitalName}?`}
        description="The facility stays unlisted as verified and the submitting doctor sees it as rejected. The reason is stored in the audit log."
        variant="destructive"
        confirmLabel="Reject facility"
        requireReason
        loading={busy}
        onCancel={() => setAction(null)}
        onConfirm={(reason) => submit('rejected', reason)}
      />
    </>
  )
}
