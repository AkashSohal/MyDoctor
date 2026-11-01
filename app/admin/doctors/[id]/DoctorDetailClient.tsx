'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Ban,
  CheckCircle2,
  Edit3,
  Loader2,
  MapPin,
  Phone,
  Trash2,
  UserX,
} from 'lucide-react'
import {
  deleteDoctor,
  setDoctorVerification,
  updateDoctorProfile,
} from '@/app/admin/actions'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { DoctorEditDialog } from '@/components/admin/doctors/DoctorEditDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatFee } from '@/lib/admin/format'

type Doc = {
  id: string
  full_name: string
  photo_url: string | null
  bio: string | null
  qualifications: string[]
  languages: string[]
  specialization_id: string | null
  experience_years: number
  consultation_fee: number
  medical_registration_number: string
  registration_council: string
  gender: string | null
  address: string | null
  verification_status: string
  rating_average: number | null
  rating_count: number | null
  user: {
    id: string
    email: string | null
    phone: string | null
    full_name: string | null
    status: string
    created_at: string
  } | null
}

export function DoctorDetailClient({
  doctor,
  specialties,
  allHospitals,
  linkedHospitals,
}: {
  doctor: Doc
  specialties: { id: string; name: string }[]
  allHospitals: { id: string; name: string; address: string | null }[]
  linkedHospitals: { id: string; name: string; address: string | null }[]
}) {
  const router = useRouter()
  const [busy, setBusy] = React.useState<string | null>(null)
  const [confirm, setConfirm] = React.useState<
    | null
    | { kind: 'verify'; status: string; title: string; description: string; destructive?: boolean }
    | { kind: 'delete' }
  >(null)
  const [editing, setEditing] = React.useState(false)

  const refresh = () => router.refresh()

  const runVerification = async (status: string, reason: string) => {
    setBusy('verify')
    try {
      const res = await setDoctorVerification(doctor.id, status, reason)
      if (res.ok) {
        toast.success(`Doctor ${status}`)
        setConfirm(null)
        refresh()
      } else {
        toast.error(res.error)
      }
    } finally {
      setBusy(null)
    }
  }

  const runDelete = async () => {
    setBusy('delete')
    try {
      const res = await deleteDoctor(doctor.id)
      if (res.ok) {
        toast.success('Doctor account deleted')
        setConfirm(null)
        router.push('/admin/doctors')
        refresh()
      } else {
        toast.error(res.error)
        setConfirm(null)
      }
    } finally {
      setBusy(null)
    }
  }

  const status = doctor.verification_status

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        {(status === 'pending' || status === 'rejected') && (
          <Button
            onClick={() =>
              setConfirm({
                kind: 'verify',
                status: 'verified',
                title: 'Approve doctor',
                description:
                  'Confirm that you have verified the medical registration number and qualifications. This unlocks the doctor profile for public discovery and booking.',
              })
            }
          >
            <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
          </Button>
        )}
        {status !== 'rejected' && status !== 'suspended' && (
          <Button
            variant="outline"
            onClick={() =>
              setConfirm({
                kind: 'verify',
                status: 'rejected',
                title: 'Reject application',
                description:
                  'The doctor will not appear in search results. Provide a reason — it is stored in the audit log.',
                destructive: true,
              })
            }
          >
            <UserX className="mr-2 h-4 w-4" /> Reject
          </Button>
        )}
        {status === 'verified' || status === 'pending' ? (
          <Button
            variant="outline"
            onClick={() =>
              setConfirm({
                kind: 'verify',
                status: 'suspended',
                title: 'Suspend account',
                description:
                  'The doctor will be hidden from search and unable to accept new bookings. Existing appointments are preserved.',
                destructive: true,
              })
            }
          >
            <Ban className="mr-2 h-4 w-4" /> Suspend
          </Button>
        ) : null}
        {status === 'suspended' || status === 'rejected' ? (
          <Button
            variant="outline"
            onClick={() =>
              setConfirm({
                kind: 'verify',
                status: 'verified',
                title: 'Reactivate account',
                description: 'Return this doctor to verified status so they can accept bookings again.',
              })
            }
          >
            <CheckCircle2 className="mr-2 h-4 w-4" /> Reactivate as verified
          </Button>
        ) : null}
        <Button variant="outline" onClick={() => setEditing(true)}>
          <Edit3 className="mr-2 h-4 w-4" /> Edit profile
        </Button>
        <Button
          variant="outline"
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => setConfirm({ kind: 'delete' })}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center p-6 text-center">
            {doctor.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={doctor.photo_url}
                alt=""
                className="h-24 w-24 rounded-2xl object-cover ring-2 ring-primary-100"
              />
            ) : (
              <span className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary-100 text-2xl font-bold text-primary-700">
                {doctor.full_name
                  .split(' ')
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join('')}
              </span>
            )}
            <h2 className="mt-4 text-lg font-bold text-secondary-900">{doctor.full_name}</h2>
            <p className="text-sm text-secondary-500">
              {specialties.find((s) => s.id === doctor.specialization_id)?.name ?? 'No specialization'}
            </p>
            <div className="mt-3">
              <Badge variant={status === 'verified' ? 'success' : status === 'pending' ? 'warning' : 'danger'}>
                {status}
              </Badge>
            </div>
            <dl className="mt-6 w-full space-y-3 text-left text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-secondary-400">Email</dt>
                <dd className="text-secondary-800">{doctor.user?.email ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-secondary-400">Phone</dt>
                <dd className="flex items-center gap-1 text-secondary-800">
                  <Phone className="h-3.5 w-3.5 text-secondary-400" />
                  {doctor.user?.phone ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-secondary-400">Account status</dt>
                <dd className="capitalize text-secondary-800">{doctor.user?.status ?? 'active'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-secondary-400">Fee</dt>
                <dd className="text-secondary-800">{formatFee(doctor.consultation_fee)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-secondary-400">Address</dt>
                <dd className="flex items-start gap-1 text-secondary-800">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary-400" />
                  {doctor.address || '—'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Assigned Hospitals</CardTitle>
          </CardHeader>
          <CardContent>
            {linkedHospitals.length > 0 ? (
              <ul className="divide-y divide-secondary-100">
                {linkedHospitals.map((h) => (
                  <li key={h.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-semibold text-secondary-900">{h.name}</p>
                      <p className="text-xs text-secondary-500">{h.address}</p>
                    </div>
                    <a
                      href={`/admin/hospitals/${h.id}`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      View
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-secondary-500">Not linked to any hospital yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirm?.kind === 'verify'}
        title={confirm?.kind === 'verify' ? confirm.title : ''}
        description={confirm?.kind === 'verify' ? confirm.description : undefined}
        variant={confirm?.kind === 'verify' && confirm.destructive ? 'destructive' : 'default'}
        confirmLabel={
          confirm?.kind === 'verify'
            ? confirm.status === 'verified'
              ? 'Approve'
              : confirm.status === 'rejected'
                ? 'Reject'
                : 'Suspend'
            : 'Confirm'
        }
        requireReason={confirm?.kind === 'verify' && confirm.status !== 'verified'}
        loading={busy === 'verify'}
        onCancel={() => setConfirm(null)}
        onConfirm={(reason) => {
          if (confirm?.kind === 'verify') runVerification(confirm.status, reason)
        }}
      />

      <ConfirmDialog
        open={confirm?.kind === 'delete'}
        title="Delete doctor account"
        description="This permanently removes the doctor profile, hospital links and availability. Doctors with appointment history cannot be deleted — suspend them instead. This action is recorded in the audit log."
        variant="destructive"
        confirmLabel="Delete permanently"
        requireReason
        loading={busy === 'delete'}
        onCancel={() => setConfirm(null)}
        onConfirm={runDelete}
      />

      {editing && (
        <DoctorEditDialog
          doctor={doctor}
          specialties={specialties}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false)
            refresh()
          }}
        />
      )}
    </>
  )
}
