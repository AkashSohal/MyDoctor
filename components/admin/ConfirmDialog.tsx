'use client'

import * as React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  requireReason?: boolean
  reasonLabel?: string
  reasonPlaceholder?: string
  loading?: boolean
  onConfirm?: (reason: string) => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  requireReason = false,
  reasonLabel = 'Reason',
  reasonPlaceholder = 'Enter a reason (recorded in the audit log)',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [reason, setReason] = React.useState('')
  const [touched, setTouched] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setReason('')
      setTouched(false)
    }
  }, [open])

  if (!open) return null

  const reasonError = requireReason && touched && !reason.trim() ? 'A reason is required' : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-secondary-900/50 backdrop-blur-sm" onClick={onCancel} aria-hidden />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative w-full max-w-md rounded-2xl border border-secondary-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              variant === 'destructive' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
            )}
          >
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="confirm-dialog-title" className="text-lg font-bold text-secondary-900">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-secondary-500">{description}</p>}
          </div>
        </div>

        {requireReason && (
          <div className="mt-4">
            <Label htmlFor="confirm-reason">
              {reasonLabel} <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="confirm-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder={reasonPlaceholder}
              rows={3}
              className="mt-1.5"
              error={reasonError ?? undefined}
            />
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            loading={loading}
            onClick={() => {
              setTouched(true)
              if (requireReason && !reason.trim()) return
              onConfirm?.(reason.trim())
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
