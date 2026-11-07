'use client'

import * as React from 'react'
import { Phone, AlertTriangle, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CALL_DISCLAIMER, dialNumber } from '@/lib/emergency'
import { toast } from 'sonner'

interface CallConfirmDialogProps {
  open: boolean
  label: string
  number: string
  onCancel: () => void
}

/**
 * Confirmation step before any emergency call. Nothing is dialled until the
 * user presses confirm, and unsupported devices get the number to dial by hand.
 */
export function CallConfirmDialog({
  open,
  label,
  number,
  onCancel,
}: CallConfirmDialogProps) {
  const [failed, setFailed] = React.useState(false)

  React.useEffect(() => {
    if (open) setFailed(false)
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  const handleConfirm = () => {
    const dialled = dialNumber(number)
    if (dialled) {
      toast.info(
        `Opening your phone dialer for ${number}. If nothing opens, dial ${number} manually from any phone.`
      )
      onCancel()
      return
    }
    setFailed(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-secondary-900/60 backdrop-blur-sm" onClick={onCancel} aria-hidden />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="call-confirm-title"
        className="relative w-full max-w-md rounded-2xl border border-secondary-200 bg-white p-6 shadow-2xl animate-scale-in"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <Phone className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="call-confirm-title" className="text-lg font-bold text-secondary-900">
              {label}?
            </h2>
            <p className="mt-1 text-sm text-secondary-500">{CALL_DISCLAIMER}</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-red-600">Number to dial</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-red-700">{number}</p>
        </div>

        {failed && (
          <p role="alert" className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            <Smartphone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            This device could not open a dialer. Please dial {number} manually from any phone.
          </p>
        )}

        <p className="mt-3 flex items-start gap-2 text-xs text-secondary-500">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-secondary-400" aria-hidden="true" />
          No call is made automatically, and no help is dispatched until your device’s phone app takes over.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" className="gap-2" onClick={handleConfirm}>
            <Phone className="h-4 w-4" aria-hidden="true" />
            Confirm call to {number}
          </Button>
        </div>
      </div>
    </div>
  )
}
