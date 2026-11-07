'use client'

import * as React from 'react'
import { Phone, PhoneCall, UserRound, Users } from 'lucide-react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { CallConfirmDialog } from '@/components/emergency/CallConfirmDialog'
import { EMERGENCY_CALL_TARGETS, isValidPhone, type EmergencyCallTarget } from '@/lib/emergency'
import type { EmergencyContact } from '@/lib/emergency/storage'
import { toast } from 'sonner'

interface CallButtonProps extends Omit<ButtonProps, 'onClick' | 'href'> {
  target: Pick<EmergencyCallTarget, 'label' | 'number'>
  icon?: React.ReactNode
}

/** Single emergency call button — always asks for confirmation first. */
export function CallButton({ target, icon, children, ...props }: CallButtonProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)} {...props}>
        {icon ?? <Phone className="h-5 w-5" aria-hidden="true" />}
        {children ?? target.label}
      </Button>
      <CallConfirmDialog
        open={open}
        label={target.label}
        number={target.number}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}

/** Call 112 + Call Ambulance, as used on the emergency dashboard. */
export function EmergencyCallActions({
  className,
  size = 'lg',
}: {
  className?: string
  size?: ButtonProps['size']
}) {
  const [openTarget, setOpenTarget] = React.useState<EmergencyCallTarget | null>(null)

  return (
    <>
      <div className={className}>
        {EMERGENCY_CALL_TARGETS.map((target) => (
          <Button
            key={target.id}
            variant="destructive"
            size={size}
            className="w-full gap-2 justify-start sm:justify-center"
            onClick={() => setOpenTarget(target)}
          >
            <Phone className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="truncate">{target.label}</span>
          </Button>
        ))}
      </div>
      <CallConfirmDialog
        open={Boolean(openTarget)}
        label={openTarget?.label ?? ''}
        number={openTarget?.number ?? ''}
        onCancel={() => setOpenTarget(null)}
      />
    </>
  )
}

interface EmergencyContactCallButtonProps extends Omit<ButtonProps, 'onClick' | 'href'> {
  contacts: EmergencyContact[]
}

/**
 * "Call Emergency Contact" — picks from the saved contacts (or tells the
 * user where to add one) and confirms before dialling.
 */
export function EmergencyContactCallButton({
  contacts,
  children,
  ...props
}: EmergencyContactCallButtonProps) {
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<EmergencyContact | null>(null)

  const usable = contacts.filter((contact) => isValidPhone(contact.phone))

  const handleOpen = () => {
    if (usable.length === 0) {
      toast.info('No emergency contact saved yet — add one under “Emergency Contacts” below.')
      const anchor = document.getElementById('emergency-contacts')
      anchor?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    if (usable.length === 1) {
      setSelected(usable[0])
      return
    }
    setPickerOpen(true)
  }

  return (
    <>
      <Button variant="outline" className="gap-2 border-red-200 text-red-700 hover:bg-red-50" onClick={handleOpen} {...props}>
        <UserRound className="h-5 w-5" aria-hidden="true" />
        {children ?? 'Call Emergency Contact'}
      </Button>

      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-secondary-900/60 backdrop-blur-sm"
            onClick={() => setPickerOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pick-contact-title"
            className="relative w-full max-w-md rounded-2xl border border-secondary-200 bg-white p-6 shadow-2xl animate-scale-in"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Users className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 id="pick-contact-title" className="text-lg font-bold text-secondary-900">
                Who should you call?
              </h2>
            </div>
            <ul className="mt-4 space-y-2">
              {usable.map((contact) => (
                <li key={contact.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-secondary-200 px-4 py-3 text-left transition-colors hover:border-red-300 hover:bg-red-50"
                    onClick={() => {
                      setPickerOpen(false)
                      setSelected(contact)
                    }}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-secondary-900">{contact.name}</span>
                      <span className="block text-xs text-secondary-500">
                        {contact.relation || 'Emergency contact'}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold tabular-nums text-red-600">
                      <PhoneCall className="h-4 w-4" aria-hidden="true" />
                      {contact.phone}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex justify-end">
              <Button variant="outline" onClick={() => setPickerOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <CallConfirmDialog
        open={Boolean(selected)}
        label={selected ? `Call ${selected.name}` : ''}
        number={selected?.phone ?? ''}
        onCancel={() => setSelected(null)}
      />
    </>
  )
}
