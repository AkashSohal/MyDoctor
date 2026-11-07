'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AddHospitalModal } from '@/components/hospitals/AddHospitalModal'
import {
  HOSPITAL_STATUS_META,
  type HospitalAffiliation,
  type HospitalListItem,
} from '@/lib/hospitals'
import {
  addHospitalAffiliationAction,
  removeHospitalAffiliationAction,
  revalidateDoctorSurfacesAction,
} from './actions'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Building2,
  CheckCircle,
  Clock,
  Edit,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
  XCircle,
} from 'lucide-react'

interface HospitalAffiliationsSectionProps {
  doctorId: string
  userId: string
  affiliations: HospitalAffiliation[]
  allHospitals: HospitalListItem[]
}

export function HospitalAffiliationsSection({
  doctorId,
  userId,
  affiliations,
  allHospitals,
}: HospitalAffiliationsSectionProps) {
  const router = useRouter()
  const [localAffiliations, setLocalAffiliations] = React.useState(affiliations)
  const [addOpen, setAddOpen] = React.useState(false)
  const [editTarget, setEditTarget] = React.useState<HospitalListItem | null>(null)
  const [removeTarget, setRemoveTarget] = React.useState<HospitalAffiliation | null>(null)
  const [statusTarget, setStatusTarget] = React.useState<HospitalAffiliation | null>(null)
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [pickerSearch, setPickerSearch] = React.useState('')
  const [busyId, setBusyId] = React.useState<string | null>(null)

  React.useEffect(() => {
    setLocalAffiliations(affiliations)
  }, [affiliations])

  const affiliatedIds = React.useMemo(
    () => new Set(localAffiliations.map((affiliation) => affiliation.hospital_id)),
    [localAffiliations]
  )

  const availableHospitals = React.useMemo(() => {
    const term = pickerSearch.trim().toLowerCase()
    return allHospitals
      .filter((hospital) => !affiliatedIds.has(hospital.id))
      .filter((hospital) => {
        if (!term) return true
        return (
          hospital.name.toLowerCase().includes(term) ||
          hospital.address.toLowerCase().includes(term) ||
          (hospital.city ?? '').toLowerCase().includes(term)
        )
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [allHospitals, affiliatedIds, pickerSearch])

  const handleAddExisting = async (hospital: HospitalListItem) => {
    if (busyId) return
    setBusyId(hospital.id)
    try {
      const result = await addHospitalAffiliationAction({ hospital_id: hospital.id })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setLocalAffiliations((current) => [
        ...current,
        {
          id: `temp-${hospital.id}`,
          doctor_id: doctorId,
          hospital_id: hospital.id,
          created_at: new Date().toISOString(),
          hospital,
        },
      ])
      toast.success(`Added ${hospital.name} to your affiliations`)
      setPickerOpen(false)
      setPickerSearch('')
      router.refresh()
    } finally {
      setBusyId(null)
    }
  }

  const handleHospitalCreated = async (hospital: HospitalListItem) => {
    const result = await addHospitalAffiliationAction({ hospital_id: hospital.id })
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setLocalAffiliations((current) => [
      ...current,
      {
        id: `temp-${hospital.id}`,
        doctor_id: doctorId,
        hospital_id: hospital.id,
        created_at: new Date().toISOString(),
        hospital,
      },
    ])
    toast.success('Hospital added to your affiliations', {
      description: 'It is pending review by the MyDoctor team.',
    })
    router.refresh()
  }

  const handleHospitalUpdated = async (hospital: HospitalListItem) => {
    setLocalAffiliations((current) =>
      current.map((affiliation) =>
        affiliation.hospital_id === hospital.id
          ? { ...affiliation, hospital: { ...affiliation.hospital, ...hospital } }
          : affiliation
      )
    )
    setEditTarget(null)
    await revalidateDoctorSurfacesAction()
    router.refresh()
  }

  const handleRemove = async () => {
    if (!removeTarget || busyId) return
    setBusyId(removeTarget.hospital_id)
    try {
      const result = await removeHospitalAffiliationAction({
        hospital_id: removeTarget.hospital_id,
      })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setLocalAffiliations((current) =>
        current.filter((affiliation) => affiliation.hospital_id !== removeTarget.hospital_id)
      )
      toast.success(`${removeTarget.hospital.name} removed from your affiliations`)
      setRemoveTarget(null)
      router.refresh()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary-500 to-teal-500" />
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-secondary-900">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                  <Building2 className="h-5 w-5" />
                </span>
                Hospital &amp; Clinic Affiliations
              </h2>
              <p className="mt-1 text-sm text-secondary-500">
                Manage every facility where you practise. New facilities are reviewed by MyDoctor
                before they go public.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setPickerOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Affiliate Existing
              </Button>
              <Button onClick={() => setAddOpen(true)}>
                <Building2 className="mr-2 h-4 w-4" />
                Add Hospital / Clinic
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {localAffiliations.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary-100">
              <Building2 className="h-8 w-8 text-secondary-400" />
            </div>
            <h3 className="text-lg font-semibold text-secondary-900">No affiliations yet</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-secondary-500">
              Add or affiliate a hospital/clinic so patients can find you at the places you practise.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={() => setPickerOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Affiliate Existing
              </Button>
              <Button onClick={() => setAddOpen(true)}>
                <Building2 className="mr-2 h-4 w-4" />
                Add New Facility
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {localAffiliations.map((affiliation) => {
            const hospital = affiliation.hospital
            const status = hospital.verification_status
              ? HOSPITAL_STATUS_META[hospital.verification_status]
              : null
            const canEdit =
              hospital.added_by === userId && hospital.verification_status === 'pending'
            const isBusy = busyId === affiliation.hospital_id

            return (
              <Card key={affiliation.id} className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-teal-500 text-white shadow-md">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-secondary-900">{hospital.name}</h3>
                          <Badge variant="outline" size="sm">
                            {hospital.hospital_type || 'Hospital'}
                          </Badge>
                          {status && (
                            <Badge variant={status.variant} size="sm" className="gap-1">
                              {hospital.verification_status === 'verified' && (
                                <CheckCircle className="h-3 w-3" />
                              )}
                              {hospital.verification_status === 'pending' && (
                                <Clock className="h-3 w-3" />
                              )}
                              {status.label}
                            </Badge>
                          )}
                          {hospital.added_by === userId && (
                            <Badge variant="info" size="sm">
                              Added by you
                            </Badge>
                          )}
                        </div>

                        <p className="mt-2 flex items-start gap-1.5 text-sm text-secondary-600">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary-400" />
                          <span>
                            {hospital.address}
                            {hospital.city ? `, ${hospital.city}` : ''}
                            {hospital.state ? `, ${hospital.state}` : ''}
                            {hospital.pin_code ? ` ${hospital.pin_code}` : ''}
                          </span>
                        </p>

                        {(hospital.phone || hospital.email || hospital.website) && (
                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                            {hospital.phone && (
                              <a
                                href={`tel:${hospital.phone}`}
                                className="inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-700"
                              >
                                <Phone className="h-3.5 w-3.5" />
                                {hospital.phone}
                              </a>
                            )}
                            {hospital.email && (
                              <a
                                href={`mailto:${hospital.email}`}
                                className="inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-700"
                              >
                                <Mail className="h-3.5 w-3.5" />
                                {hospital.email}
                              </a>
                            )}
                            {hospital.website && (
                              <a
                                href={hospital.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-700"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Website
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStatusTarget(affiliation)}
                      >
                        <ShieldCheck className="mr-1.5 h-4 w-4" />
                        View Status
                      </Button>
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditTarget(hospital)}
                          disabled={isBusy}
                        >
                          <Edit className="mr-1.5 h-4 w-4" />
                          Edit Details
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => setRemoveTarget(affiliation)}
                        disabled={isBusy}
                        loading={isBusy}
                      >
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>

                  {canEdit && (
                    <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      This facility is pending review. You can edit its details until it is verified.
                    </p>
                  )}
                  {hospital.added_by === userId && hospital.verification_status === 'verified' && (
                    <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                      Verified facilities are maintained by MyDoctor. Contact support to request a change.
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add new facility (shared Part 1 form) */}
      <AddHospitalModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        userId={userId}
        existingHospitals={allHospitals}
        onCreated={handleHospitalCreated}
      />

      {/* Edit own pending facility (same shared form, edit mode) */}
      <AddHospitalModal
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        userId={userId}
        hospital={editTarget}
        existingHospitals={allHospitals}
        onCreated={() => undefined}
        onUpdated={handleHospitalUpdated}
      />

      {/* Existing hospital picker */}
      {pickerOpen && (
        <ModalShell title="Affiliate an existing hospital" onClose={() => setPickerOpen(false)}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
            <Input
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              placeholder="Search by name, address or city..."
              className="pl-9"
              autoFocus
            />
          </div>

          <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
            {availableHospitals.map((hospital) => (
              <div
                key={hospital.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-secondary-200 p-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-secondary-900">{hospital.name}</p>
                    {hospital.verification_status && (
                      <Badge
                        variant={HOSPITAL_STATUS_META[hospital.verification_status].variant}
                        size="sm"
                      >
                        {HOSPITAL_STATUS_META[hospital.verification_status].label}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-secondary-500">{hospital.address}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAddExisting(hospital)}
                  loading={busyId === hospital.id}
                  disabled={Boolean(busyId)}
                  className="shrink-0"
                >
                  Add
                </Button>
              </div>
            ))}

            {availableHospitals.length === 0 && (
              <div className="py-8 text-center text-sm text-secondary-500">
                {allHospitals.length === 0
                  ? 'No hospitals are listed yet. Add a new facility instead.'
                  : pickerSearch
                    ? 'No matching hospitals found.'
                    : 'You are already affiliated with every listed hospital.'}
              </div>
            )}
          </div>
        </ModalShell>
      )}

      {/* Verification status */}
      {statusTarget && (
        <ModalShell
          title="Verification status"
          onClose={() => setStatusTarget(null)}
          icon={<ShieldCheck className="h-5 w-5" />}
        >
          <div className="space-y-4">
            <div>
              <p className="text-lg font-semibold text-secondary-900">{statusTarget.hospital.name}</p>
              <p className="text-sm text-secondary-500">{statusTarget.hospital.address}</p>
            </div>
            <div className="rounded-xl border border-secondary-200 bg-secondary-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-secondary-500">Status</p>
              <div className="mt-2">
                {statusTarget.hospital.verification_status === 'verified' && (
                  <Badge variant="success" size="lg" className="gap-1.5">
                    <CheckCircle className="h-4 w-4" /> Verified
                  </Badge>
                )}
                {statusTarget.hospital.verification_status === 'pending' && (
                  <Badge variant="warning" size="lg" className="gap-1.5">
                    <Clock className="h-4 w-4" /> Pending review
                  </Badge>
                )}
                {statusTarget.hospital.verification_status === 'rejected' && (
                  <Badge variant="danger" size="lg" className="gap-1.5">
                    <XCircle className="h-4 w-4" /> Rejected
                  </Badge>
                )}
              </div>
              <p className="mt-3 text-sm text-secondary-600">
                {statusTarget.hospital.verification_status === 'verified' &&
                  'This facility has been verified by the MyDoctor team and can appear on public profiles.'}
                {statusTarget.hospital.verification_status === 'pending' &&
                  'Your facility is queued for review. You can still edit its details while it is pending.'}
                {statusTarget.hospital.verification_status === 'rejected' &&
                  'This facility was not approved. Please contact MyDoctor support if you believe this is a mistake.'}
              </p>
            </div>
            <p className="text-xs text-secondary-400">
              Only MyDoctor administrators can change a facility&apos;s verification status.
            </p>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setStatusTarget(null)}>
                Close
              </Button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Remove confirmation */}
      {removeTarget && (
        <ModalShell
          title="Remove affiliation?"
          onClose={() => (busyId ? undefined : setRemoveTarget(null))}
          icon={<Trash2 className="h-5 w-5" />}
        >
          <div className="space-y-4">
            <p className="text-sm text-secondary-600">
              Remove <span className="font-semibold text-secondary-900">{removeTarget.hospital.name}</span>{' '}
              from your affiliations? Any availability slots at this facility will also be removed.
              This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRemoveTarget(null)}
                disabled={Boolean(busyId)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRemove}
                loading={busyId === removeTarget.hospital_id}
              >
                Remove Affiliation
              </Button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  )
}

function ModalShell({
  title,
  icon,
  onClose,
  children,
}: {
  title: string
  icon?: React.ReactNode
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-secondary-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-secondary-100 px-6 py-4">
          {icon && (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              {icon}
            </span>
          )}
          <h2 className="flex-1 text-lg font-bold text-secondary-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-secondary-400 transition-colors hover:bg-secondary-100 hover:text-secondary-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
