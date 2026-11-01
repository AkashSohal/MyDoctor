'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Edit, Plus, Search, Trash2, X } from 'lucide-react'
import { createSpecialty, deleteSpecialty, updateSpecialty } from '@/app/admin/actions'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { ImageUploadField } from '@/components/admin/ImageUploadField'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDate } from '@/lib/admin/format'
import { HeartPulse } from 'lucide-react'

type Specialty = {
  id: string
  name: string
  description: string | null
  icon: string | null
  created_at: string
  doctorCount: number
}

export function SpecialtyManager({ specialties }: { specialties: Specialty[] }) {
  const router = useRouter()
  const [search, setSearch] = React.useState('')
  const [editing, setEditing] = React.useState<Specialty | null | 'new'>(null)
  const [deleting, setDeleting] = React.useState<Specialty | null>(null)
  const [busy, setBusy] = React.useState(false)

  const filtered = specialties.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async () => {
    if (!deleting) return
    setBusy(true)
    try {
      const res = await deleteSpecialty(deleting.id)
      if (res.ok) {
        toast.success('Specialty deleted')
        setDeleting(null)
        router.refresh()
      } else {
        toast.error(res.error)
        setDeleting(null)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search specialties…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="sm:w-72"
        />
        <Button onClick={() => setEditing('new')}>
          <Plus className="mr-2 h-4 w-4" /> Add specialty
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<HeartPulse className="h-8 w-8 text-secondary-400" />}
              title="No specialties found"
              description="Add the first specialty or adjust your search."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((specialty) => (
            <Card key={specialty.id} className="transition-shadow hover:shadow-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {specialty.icon?.startsWith('http') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={specialty.icon}
                        alt=""
                        className="h-11 w-11 rounded-xl object-cover ring-1 ring-primary-100"
                      />
                    ) : (
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                        <HeartPulse className="h-5 w-5" />
                      </span>
                    )}
                    <div>
                      <h3 className="font-bold text-secondary-900">{specialty.name}</h3>
                      <p className="text-xs text-secondary-400">Added {formatDate(specialty.created_at)}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{specialty.doctorCount} doctors</Badge>
                </div>
                {specialty.description && (
                  <p className="mt-3 line-clamp-2 text-sm text-secondary-500">{specialty.description}</p>
                )}
                <div className="mt-4 flex gap-2 border-t border-secondary-100 pt-3">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(specialty)}>
                    <Edit className="mr-1.5 h-4 w-4" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => setDeleting(specialty)}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <SpecialtyDialog
          specialty={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete ${deleting?.name ?? 'specialty'}?`}
        description={
          deleting && deleting.doctorCount > 0
            ? 'Doctors are still assigned to this specialty and the deletion will fail. Reassign them first.'
            : 'This removes the specialty from the catalog.'
        }
        variant="destructive"
        confirmLabel="Delete specialty"
        requireReason
        loading={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </>
  )
}

function SpecialtyDialog({
  specialty,
  onClose,
}: {
  specialty: Specialty | null
  onClose: () => void
}) {
  const router = useRouter()
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState({
    name: specialty?.name ?? '',
    description: specialty?.description ?? '',
    icon: specialty?.icon ?? '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      const res = specialty
        ? await updateSpecialty(specialty.id, form)
        : await createSpecialty(form)
      if (res.ok) {
        toast.success(specialty ? 'Specialty updated' : 'Specialty created')
        router.refresh()
        onClose()
      } else {
        toast.error(res.error)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-secondary-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-secondary-900">
            {specialty ? 'Edit specialty' : 'Add specialty'}
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-secondary-100" aria-label="Close">
            <X className="h-5 w-5 text-secondary-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <div>
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <ImageUploadField
            label="Icon image"
            value={form.icon?.startsWith('http') ? form.icon : null}
            onChange={(url) => setForm((f) => ({ ...f, icon: url ?? '' }))}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {specialty ? 'Save changes' : 'Create specialty'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
