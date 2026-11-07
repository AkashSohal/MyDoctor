'use client'

import * as React from 'react'
import { AlertTriangle, Siren, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmergencyCallActions } from '@/components/emergency/CallButtons'
import { LocationShare } from '@/components/emergency/LocationShare'
import { NO_DISPATCH_NOTICE } from '@/lib/emergency'
import type { EmergencyContact } from '@/lib/emergency/storage'
import { cn } from '@/lib/utils'

interface SosButtonProps {
  contacts: EmergencyContact[]
  /** 'hero' renders the large dashboard button, 'compact' a smaller one. */
  variant?: 'hero' | 'compact'
  className?: string
}

/**
 * SOS entry point. Opens a confirmation screen — the user always picks the
 * action (call 112, call ambulance, share location) themselves.
 */
export function SosButton({ contacts, variant = 'hero', className }: SosButtonProps) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  if (variant === 'compact') {
    return (
      <>
        <Button
          variant="destructive"
          size="lg"
          className={cn('gap-2 font-bold', className)}
          onClick={() => setOpen(true)}
        >
          <Siren className="h-5 w-5" aria-hidden="true" />
          Emergency SOS
        </Button>
        <SosDialog open={open} contacts={contacts} onClose={() => setOpen(false)} />
      </>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Emergency SOS — opens emergency options"
        className={cn(
          'group relative inline-flex h-36 w-36 select-none flex-col items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white shadow-[0_18px_45px_-12px_rgba(220,38,38,0.7)] transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-300 active:scale-95 sm:h-40 sm:w-40',
          className
        )}
      >
        <span
          className="absolute inset-0 -z-10 animate-ping rounded-full bg-red-500/40 motion-reduce:hidden"
          aria-hidden="true"
        />
        <Siren className="mb-1 h-8 w-8 sm:h-9 sm:w-9" aria-hidden="true" />
        <span className="text-3xl font-extrabold tracking-widest sm:text-4xl">SOS</span>
        <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-red-100 sm:text-xs">
          Tap for help
        </span>
      </button>
      <SosDialog open={open} contacts={contacts} onClose={() => setOpen(false)} />
    </>
  )
}

function SosDialog({
  open,
  contacts,
  onClose,
}: {
  open: boolean
  contacts: EmergencyContact[]
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-secondary-900/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sos-title"
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-2xl animate-scale-in"
      >
        <div className="flex items-start gap-3 border-b border-red-100 bg-gradient-to-r from-red-600 to-red-700 px-5 py-4 text-white sm:px-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
            <Siren className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="sos-title" className="text-lg font-bold">Emergency SOS</h2>
            <p className="text-sm text-red-100">Choose what you need — nothing happens until you tap a button.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close emergency options"
            className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
          <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
            {NO_DISPATCH_NOTICE} Calls are placed by your own device’s dialer after you confirm.
          </p>

          <div className="grid gap-3">
            <EmergencyCallActions className="grid gap-3" size="lg" />
          </div>

          <LocationShare contacts={contacts} />
        </div>

        <div className="border-t border-secondary-200 bg-secondary-50 px-5 py-4 sm:px-6">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
