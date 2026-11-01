'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Edit3, Trash2, UserPlus, X } from 'lucide-react'
import { assignDoctorToHospital, deleteHospital, removeDoctorFromHospital } from '@/app/admin/actions'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { HospitalForm, type HospitalFormValue } from '@/components/admin/hospitals/HospitalForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

type DoctorRow = {
  id: string
  full_name: string
  verification_status: string
  specialization: { name: string } | null
}

export function HospitalDetailClient({
  hospital,
  specialties,
  linkedDoctors,
  availableDoctors,
}: {
  hospital: HospitalFormValue & { id: string }
  specialties: { id: string; name: string }[]
  linkedDoctors: DoctorRow[]
  availableDoctors: DoctorRow[]
}) {
  const router = useRouter()
  const [editing, setEditing] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [assignId, setAssignId] = React.useState('')

  const removeDoctor = async (doctorId: string, name: string) => {
    setBusy(true)
    try {
      const res = await removeDoctorFromHospital(hospital.id, doctorId)
      if (res.ok) {
        toast.success(`${name} removed from hospital`)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } finally {
      setBusy(false)
    }
  }

  const assign = async () => {
    if (!assignId) return
    setBusy(true)
    try {
      const res = await assignDoctorToHospital(hospital.id, assignId)
      if (res.ok) {
        toast.success('Doctor assigned')
        setAssignId('')
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } finally {
      setBusy(false)
    }
  }

  const removeHospital = async () => {
    setBusy(true)
    try {
      const res = await deleteHospital(hospital.id)
      if (res.ok) {
        toast.success('Hospital deleted')
        router.push('/admin/hospitals')
        router.refresh()
      } else {
        toast.error(res.error)
        setConfirmDelete(false)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setEditing((v) => !v)}>
          <Edit3 className="mr-2 h-4 w-4" /> {editing ? 'Close editor' : 'Edit hospital'}
        </Button>
        <Button
          variant="outline"
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </div>

      {editing && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Edit details</CardTitle>
          </CardHeader>
          <CardContent>
            <HospitalForm hospital={hospital} specialties={specialties} onClose={() => setEditing(false)} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Doctors at this hospital</CardTitle>
            <div className="flex items-center gap-2">
              <Select
                value={assignId}
                onChange={(e) => setAssignId(e.target.value)}
                className="w-64"
                aria-label="Select doctor to assign"
              >
                <option value="">Select doctor to assign…</option>
                {availableDoctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name} ({d.specialization?.name ?? 'General'})
                  </option>
                ))}
              </Select>
              <Button onClick={assign} disabled={!assignId || busy} size="sm">
                <UserPlus className="mr-1.5 h-4 w-4" /> Assign
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {linkedDoctors.length > 0 ? (
            <ul className="divide-y divide-secondary-100">
              {linkedDoctors.map((doctor) => (
                <li key={doctor.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-secondary-900">
                      {doctor.full_name}
                      <span className="ml-2 text-xs font-normal text-secondary-400">
                        {doctor.specialization?.name ?? ''}
                      </span>
                    </p>
                    <Badge
                      variant={
                        doctor.verification_status === 'verified'
                          ? 'success'
                          : doctor.verification_status === 'pending'
                            ? 'warning'
                            : 'danger'
                      }
                      size="sm"
                      className="mt-1"
                    >
                      {doctor.verification_status}
                    </Badge>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/admin/doctors/${doctor.id}`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      Profile
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:bg-red-50"
                      onClick={() => removeDoctor(doctor.id, doctor.full_name)}
                      disabled={busy}
                      aria-label={`Remove ${doctor.full_name}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-4 text-sm text-secondary-500">No doctors assigned yet.</p>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete hospital"
        description="This permanently removes the hospital, its specialty links and doctor assignments. Hospitals with appointment history cannot be deleted."
        variant="destructive"
        confirmLabel="Delete hospital"
        requireReason
        loading={busy}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={removeHospital}
      />
    </>
  )
}
