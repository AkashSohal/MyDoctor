'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, CheckCheck, Eye, X } from 'lucide-react'
import { setAppointmentStatus } from '@/app/admin/actions'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'

const ACTIONS = {
  confirm: { status: 'confirmed', title: 'Confirm appointment', label: 'Confirm' },
  cancel: { status: 'cancelled', title: 'Cancel appointment', label: 'Cancel', destructive: true },
  complete: { status: 'completed', title: 'Mark as completed', label: 'Complete' },
} as const

type ActionKey = keyof typeof ACTIONS

export function AppointmentRowActions({
  id,
  status,
  patientMessage,
}: {
  id: string
  status: string
  patientMessage: string | null
}) {
  const router = useRouter()
  const [action, setAction] = React.useState<ActionKey | 'view' | null>(null)
  const [busy, setBusy] = React.useState(false)

  const apply = async (next: string, reason: string) => {
    setBusy(true)
    try {
      const res = await setAppointmentStatus(id, next, reason)
      if (res.ok) {
        toast.success(`Appointment ${next}`)
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
      <div className="flex items-center gap-1.5">
        {status === 'pending' && (
          <Button size="sm" onClick={() => setAction('confirm')}>
            <Check className="mr-1 h-3.5 w-3.5" /> Confirm
          </Button>
        )}
        {(status === 'pending' || status === 'confirmed') && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:bg-red-50"
              onClick={() => setAction('cancel')}
            >
              <X className="mr-1 h-3.5 w-3.5" /> Cancel
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAction('complete')}>
              <CheckCheck className="mr-1 h-3.5 w-3.5" /> Complete
            </Button>
          </>
        )}
        <Button size="sm" variant="ghost" onClick={() => setAction('view')} aria-label="View details">
          <Eye className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ConfirmDialog
        open={action === 'confirm'}
        title={ACTIONS.confirm.title}
        description="Mark this appointment as confirmed. The patient and doctor will see the updated status."
        confirmLabel={ACTIONS.confirm.label}
        loading={busy}
        onCancel={() => setAction(null)}
        onConfirm={(reason) => apply('confirmed', reason)}
      />

      <ConfirmDialog
        open={action === 'cancel'}
        title={ACTIONS.cancel.title}
        description="The slot will be freed for other patients. Provide a reason for the audit log."
        variant="destructive"
        confirmLabel={ACTIONS.cancel.label}
        requireReason
        loading={busy}
        onCancel={() => setAction(null)}
        onConfirm={(reason) => apply('cancelled', reason)}
      />

      <ConfirmDialog
        open={action === 'complete'}
        title={ACTIONS.complete.title}
        description="Mark this appointment as completed. This enables the patient to leave a review."
        confirmLabel={ACTIONS.complete.label}
        loading={busy}
        onCancel={() => setAction(null)}
        onConfirm={(reason) => apply('completed', reason)}
      />

      <ConfirmDialog
        open={action === 'view'}
        title="Appointment details"
        description={
          patientMessage
            ? `Patient message: "${patientMessage}"`
            : 'No patient message was provided for this appointment.'
        }
        confirmLabel="Close"
        cancelLabel="Back"
        onCancel={() => setAction(null)}
        onConfirm={() => setAction(null)}
      />
    </>
  )
}
