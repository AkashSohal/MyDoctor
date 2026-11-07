'use client'

import * as React from 'react'
import { Phone, Plus, Trash2, Users, Pencil, MapPin, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CallConfirmDialog } from '@/components/emergency/CallConfirmDialog'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { ShareLocationDialog } from '@/components/emergency/ShareLocationDialog'
import { isValidPhone } from '@/lib/emergency'
import { useEmergencyContacts, type EmergencyContact } from '@/lib/emergency/storage'
import { toast } from 'sonner'

type ContactsApi = ReturnType<typeof useEmergencyContacts>

interface EmergencyContactsSectionProps extends ContactsApi {
  /** Section heading — the dashboard says "My Emergency Contacts". */
  heading?: string
}

export function EmergencyContactsSection({
  contacts,
  loaded,
  addContact,
  updateContact,
  removeContact,
  heading = 'Your emergency contacts',
}: EmergencyContactsSectionProps) {
  const [name, setName] = React.useState('')
  const [relation, setRelation] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [errors, setErrors] = React.useState<{ name?: string; phone?: string }>({})
  const [callTarget, setCallTarget] = React.useState<EmergencyContact | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<EmergencyContact | null>(null)
  const [shareTarget, setShareTarget] = React.useState<EmergencyContact | null>(null)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editName, setEditName] = React.useState('')
  const [editRelation, setEditRelation] = React.useState('')
  const [editPhone, setEditPhone] = React.useState('')
  const [editErrors, setEditErrors] = React.useState<{ name?: string; phone?: string }>({})

  const validate = (
    n: string,
    p: string
  ): { name?: string; phone?: string } => {
    const next: { name?: string; phone?: string } = {}
    if (!n.trim()) next.name = 'Name is required'
    if (!isValidPhone(p)) next.phone = 'Enter a valid phone number (digits only, 7–17)'
    return next
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const nextErrors = validate(name, phone)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const saved = addContact({ name, relation, phone })
    if (!saved) {
      toast.error('This browser blocked local storage — the contact was not saved.')
      return
    }
    toast.success(`${name.trim()} added to your emergency contacts`)
    setName('')
    setRelation('')
    setPhone('')
  }

  const startEdit = (contact: EmergencyContact) => {
    setEditingId(contact.id)
    setEditName(contact.name)
    setEditRelation(contact.relation)
    setEditPhone(contact.phone)
    setEditErrors({})
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditErrors({})
  }

  const handleSaveEdit = (contact: EmergencyContact) => {
    const nextErrors = validate(editName, editPhone)
    setEditErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const saved = updateContact(contact.id, { name: editName, relation: editRelation, phone: editPhone })
    if (!saved) {
      toast.error('This browser blocked local storage — the change was not saved.')
      return
    }
    toast.success(`${editName.trim()} updated`)
    cancelEdit()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Add contact form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-secondary-200 bg-white p-5 sm:p-6">
        <h3 className="flex items-center gap-2 text-base font-semibold text-secondary-900">
          <Plus className="h-5 w-5 text-primary-600" aria-hidden="true" />
          Add an emergency contact
        </h3>
        <p className="mt-1 text-sm text-secondary-500">
          Saved on this device only — used by the SOS screen to share your location and start a call.
        </p>

        <div className="mt-4 space-y-4">
          <Input
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Priya Sharma"
            error={errors.name}
          />
          <Input
            label="Relationship"
            value={relation}
            onChange={(event) => setRelation(event.target.value)}
            placeholder="e.g. Spouse, Parent, Friend"
          />
          <Input
            label="Phone number"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="e.g. 9876543210"
            error={errors.phone}
          />
        </div>

        <Button type="submit" className="mt-5 w-full gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Save contact
        </Button>
      </form>

      {/* Contact list */}
      <div className="rounded-2xl border border-secondary-200 bg-white p-5 sm:p-6">
        <h3 className="flex items-center gap-2 text-base font-semibold text-secondary-900">
          <Users className="h-5 w-5 text-primary-600" aria-hidden="true" />
          {heading}
        </h3>

        {!loaded ? (
          <div className="mt-4 space-y-3" aria-hidden="true">
            <div className="h-16 animate-pulse rounded-xl bg-secondary-100" />
            <div className="h-16 animate-pulse rounded-xl bg-secondary-100" />
          </div>
        ) : contacts.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-secondary-300 bg-secondary-50 p-4 text-sm text-secondary-500">
            No contacts yet. Add at least one so the SOS screen can share your location with someone you trust.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {contacts.map((contact) => {
              const editing = editingId === contact.id
              return (
                <li
                  key={contact.id}
                  className="rounded-xl border border-secondary-200 p-3"
                >
                  {editing ? (
                    <div className="space-y-3">
                      <Input
                        label="Name"
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        error={editErrors.name}
                        aria-label="Edit contact name"
                      />
                      <Input
                        label="Relationship"
                        value={editRelation}
                        onChange={(event) => setEditRelation(event.target.value)}
                        aria-label="Edit contact relationship"
                      />
                      <Input
                        label="Phone number"
                        type="tel"
                        inputMode="tel"
                        value={editPhone}
                        onChange={(event) => setEditPhone(event.target.value)}
                        error={editErrors.phone}
                        aria-label="Edit contact phone number"
                      />
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={cancelEdit}>
                          <X className="h-4 w-4" aria-hidden="true" />
                          Cancel
                        </Button>
                        <Button size="sm" className="gap-1.5" onClick={() => handleSaveEdit(contact)}>
                          <Check className="h-4 w-4" aria-hidden="true" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-secondary-900">{contact.name}</p>
                        <p className="truncate text-xs text-secondary-500">
                          {contact.relation || 'Emergency contact'} ·{' '}
                          <span className="tabular-nums">{contact.phone}</span>
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1.5"
                          onClick={() => setCallTarget(contact)}
                        >
                          <Phone className="h-4 w-4" aria-hidden="true" />
                          Call
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => setShareTarget(contact)}
                        >
                          <MapPin className="h-4 w-4" aria-hidden="true" />
                          Share location
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`Edit ${contact.name}`}
                          onClick={() => startEdit(contact)}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`Remove ${contact.name}`}
                          className="text-secondary-400 hover:text-red-600"
                          onClick={() => setDeleteTarget(contact)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <CallConfirmDialog
        open={Boolean(callTarget)}
        label={callTarget ? `Call ${callTarget.name}` : ''}
        number={callTarget?.phone ?? ''}
        onCancel={() => setCallTarget(null)}
      />

      <ShareLocationDialog
        open={Boolean(shareTarget)}
        contact={shareTarget}
        onCancel={() => setShareTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remove emergency contact?"
        description={deleteTarget ? `${deleteTarget.name} will be removed from this device.` : ''}
        confirmLabel="Remove"
        variant="destructive"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            removeContact(deleteTarget.id)
            toast.success(`${deleteTarget.name} removed`)
          }
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}
