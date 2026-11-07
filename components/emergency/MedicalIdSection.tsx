'use client'

import * as React from 'react'
import Link from 'next/link'
import QRCode from 'qrcode'
import {
  AlertCircle,
  Copy,
  Download,
  IdCard,
  Link2,
  Loader2,
  LogIn,
  Printer,
  QrCode,
  RefreshCcw,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { toast } from 'sonner'
import type { EmergencyProfile } from '@/lib/emergency/profile'
import {
  SHAREABLE_FIELDS,
  SHARE_DURATIONS,
  buildSharePayload,
  payloadHasContent,
  type ShareableField,
  type UseEmergencyMedicalIdResult,
} from '@/lib/emergency/medicalId'

interface MedicalIdSectionProps extends UseEmergencyMedicalIdResult {
  profile: EmergencyProfile
  profileLoaded: boolean
  profileExists: boolean
}

const FIELD_LABELS: Record<ShareableField, string> = {
  name: 'Patient name',
  bloodGroup: 'Blood group',
  allergies: 'Known allergies',
  conditions: 'Medical conditions',
  emergencyContact: 'Emergency contact',
}

const FIELD_KEYS: Record<ShareableField, (profile: EmergencyProfile) => string> = {
  name: (profile) => profile.full_name,
  bloodGroup: (profile) => profile.blood_group,
  allergies: (profile) => profile.allergies,
  conditions: (profile) => profile.conditions,
  emergencyContact: (profile) =>
    [profile.emergency_contact_name, profile.emergency_contact_number].filter(Boolean).join(' · '),
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

/**
 * TASK 2 — Digital Emergency Medical ID.
 *
 * Renders the card the patient can print, the field picker that decides what
 * the QR code publishes, the QR generator itself (which creates a revocable,
 * expiring share — never a link to raw database records) and the list of live
 * shares with one-tap revoke.
 */
export function MedicalIdSection({
  profile,
  profileLoaded,
  profileExists,
  isAuthenticated,
  shares,
  loaded: sharesLoaded,
  creating,
  activeShareUrl,
  createShare,
  revokeShare,
  clearActiveShare,
}: MedicalIdSectionProps) {
  const [selected, setSelected] = React.useState<ShareableField[]>([
    'name',
    'bloodGroup',
    'allergies',
    'conditions',
    'emergencyContact',
  ])
  const [durationHours, setDurationHours] = React.useState<number>(24)
  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null)
  const [qrBusy, setQrBusy] = React.useState(false)
  const [revokeTarget, setRevokeTarget] = React.useState<{ id: string; label: string } | null>(null)

  const toggleField = (field: ShareableField) => {
    setSelected((previous) =>
      previous.includes(field) ? previous.filter((item) => item !== field) : [...previous, field]
    )
  }

  const regenerateQr = React.useCallback(async (url: string) => {
    setQrBusy(true)
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#0f172a', light: '#ffffff' },
      })
      setQrDataUrl(dataUrl)
    } catch (error) {
      console.error('[MyDoctor] QR generation failed:', error)
      setQrDataUrl(null)
      toast.error('QR image could not be generated — copy the link instead.')
    } finally {
      setQrBusy(false)
    }
  }, [])

  React.useEffect(() => {
    if (!activeShareUrl) {
      setQrDataUrl(null)
      return
    }
    void regenerateQr(activeShareUrl)
  }, [activeShareUrl, regenerateQr])

  const handleGenerate = async () => {
    if (!isAuthenticated) {
      toast.error('Sign in to generate a shareable medical ID.')
      return
    }
    if (!profileExists) {
      toast.error('Save your emergency medical information first.')
      return
    }
    const chosen = selected.filter((field) => FIELD_KEYS[field](profile).trim())
    if (chosen.length === 0 || !payloadHasContent(buildSharePayload(profile, chosen))) {
      toast.error('Choose at least one field that has saved information.')
      return
    }

    const result = await createShare(profile, chosen, durationHours)
    if (!result.ok) {
      toast.error(result.error ?? 'Could not create the share link.')
      return
    }
    toast.success('Shareable medical ID created — it expires automatically.')
  }

  const handleCopy = async () => {
    if (!activeShareUrl) return
    try {
      await navigator.clipboard.writeText(activeShareUrl)
      toast.success('Link copied to clipboard')
    } catch {
      toast.error('Could not copy — select the link and copy it manually.')
    }
  }

  const handleDownloadQr = () => {
    if (!qrDataUrl) return
    try {
      const anchor = document.createElement('a')
      anchor.href = qrDataUrl
      anchor.download = 'mydoctor-emergency-medical-id-qr.png'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      toast.success('QR code downloaded')
    } catch {
      toast.error('Could not download the QR code in this browser.')
    }
  }

  const handlePrint = () => {
    try {
      window.print()
    } catch {
      toast.error('Printing is not available in this browser.')
    }
  }

  const handleRevoke = async () => {
    if (!revokeTarget) return
    const result = await revokeShare(revokeTarget.id)
    setRevokeTarget(null)
    if (!result.ok) {
      toast.error(result.error ?? 'Could not revoke the share.')
      return
    }
    toast.success('Access revoked — the link no longer works')
  }

  // The card shows exactly what a generated share would publish: only the
  // ticked fields, and only when they hold a value.
  const visibleRows = React.useMemo(
    () =>
      SHAREABLE_FIELDS.filter((field) => selected.includes(field))
        .map((field) => ({ label: FIELD_LABELS[field], value: FIELD_KEYS[field](profile).trim() }))
        .filter((row) => row.value.length > 0),
    [profile, selected]
  )

  return (
    <>
      {/* Print only the card, never the controls */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #medical-id-print,
          #medical-id-print * {
            visibility: visible !important;
          }
          #medical-id-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 16px;
          }
        }
      `}</style>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Card preview + field picker */}
        <div className="lg:col-span-3">
          {!isAuthenticated && profileLoaded && (
            <div className="mb-4 rounded-2xl border border-primary-200 bg-primary-50 p-5">
              <h3 className="flex items-center gap-2 text-base font-semibold text-primary-900">
                <LogIn className="h-5 w-5" aria-hidden="true" />
                Sign in to create your digital medical ID
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-primary-800/90">
                The QR code is built from your saved emergency medical information and can be
                revoked at any time.
              </p>
              <Button asChild className="mt-4 gap-2">
                <Link href="/auth/login?redirect=/emergency">
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  Sign in
                </Link>
              </Button>
            </div>
          )}

          <div id="medical-id-print" className="rounded-2xl border border-secondary-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-base font-semibold text-secondary-900">
                <IdCard className="h-5 w-5 text-primary-600" aria-hidden="true" />
                Digital Emergency Medical ID
              </h3>
              <span className="rounded-full bg-red-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-red-700">
                Emergency use only
              </span>
            </div>

            {!profileLoaded ? (
              <div className="mt-5 space-y-3" aria-hidden="true">
                <div className="h-8 animate-pulse rounded-lg bg-secondary-100" />
                <div className="h-24 animate-pulse rounded-xl bg-secondary-100" />
              </div>
            ) : visibleRows.length > 0 ? (
              <dl className="mt-4">
                {visibleRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-start justify-between gap-4 border-t border-secondary-100 py-2.5 first:border-t-0"
                  >
                    <dt className="shrink-0 text-xs font-semibold uppercase tracking-wide text-secondary-500">
                      {row.label}
                    </dt>
                    <dd className="min-w-0 break-words text-right text-sm font-medium text-secondary-900">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-secondary-300 bg-secondary-50 p-4 text-sm text-secondary-500">
                Tick at least one field below that has saved information to build your medical ID.
              </p>
            )}

            <p className="mt-4 flex items-start gap-2 rounded-xl bg-secondary-50 p-3 text-xs leading-relaxed text-secondary-500">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-600" aria-hidden="true" />
              This card is not a diagnosis. In an emergency, call {''}
              <strong className="text-secondary-700">112</strong> first — show this ID to
              responders only if it helps them treat you.
            </p>
          </div>

          {/* Field selection — decides what a generated share publishes */}
          <div className="mt-4 rounded-2xl border border-secondary-200 bg-white p-5 sm:p-6">
            <h4 className="text-sm font-semibold text-secondary-900">
              Choose what your QR code shares
            </h4>
            <p className="mt-1 text-xs text-secondary-500">
              Only ticked fields with saved values are copied into the share. Your medications,
              account details and everything else always stay private.
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {SHAREABLE_FIELDS.map((field) => {
                const value = FIELD_KEYS[field](profile)
                const available = value.trim().length > 0
                const checked = selected.includes(field)
                return (
                  <li key={field}>
                    <label
                      className={`flex items-center gap-2.5 rounded-xl border border-secondary-200 px-3 py-2.5 text-sm transition-colors ${
                        available
                          ? 'cursor-pointer hover:border-primary-300 hover:bg-primary-50/40'
                          : 'cursor-not-allowed opacity-60'
                      } ${checked && available ? 'border-primary-300 bg-primary-50/60' : ''}`}
                    >
                      <Checkbox
                        checked={checked && available}
                        disabled={!available || !isAuthenticated}
                        onCheckedChange={() => toggleField(field)}
                        aria-label={`Share ${FIELD_LABELS[field].toLowerCase()}`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-secondary-900">
                          {FIELD_LABELS[field]}
                        </span>
                        <span className="block truncate text-xs text-secondary-500">
                          {available ? value : 'No information saved yet'}
                        </span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        {/* QR + live shares */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-primary-200 bg-primary-50/70 p-5 sm:p-6">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-primary-900">
              <QrCode className="h-5 w-5" aria-hidden="true" />
              QR code for responders
            </h4>

            {!isAuthenticated ? (
              <p className="mt-3 text-sm text-primary-900/80">
                Sign in to generate a revocable QR share of the fields you choose above.
              </p>
            ) : !profileExists && profileLoaded ? (
              <p className="mt-3 text-sm text-primary-900/80">
                Save your emergency medical information first — the QR code is built from it.
              </p>
            ) : null}

            <div className="mt-4 flex flex-col items-center gap-4">
              {activeShareUrl ? (
                <>
                  <div className="rounded-xl border border-secondary-200 bg-white p-3">
                    {qrBusy ? (
                      <div className="flex h-40 w-40 flex-col items-center justify-center gap-2 text-secondary-500">
                        <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                        <span className="text-xs">Generating…</span>
                      </div>
                    ) : qrDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qrDataUrl}
                        alt="QR code linking to your shared emergency medical ID"
                        className="h-40 w-40"
                      />
                    ) : (
                      <div className="flex h-40 w-40 flex-col items-center justify-center gap-2 px-3 text-center text-xs text-secondary-500">
                        <AlertCircle className="h-5 w-5 text-amber-500" aria-hidden="true" />
                        QR image unavailable — copy the link below instead.
                      </div>
                    )}
                  </div>

                  <div className="flex w-full items-center gap-2 rounded-xl border border-primary-200 bg-white px-3 py-2">
                    <Link2 className="h-4 w-4 shrink-0 text-secondary-400" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-xs text-secondary-600" title={activeShareUrl}>
                      {activeShareUrl}
                    </span>
                    <Button size="sm" variant="ghost" className="h-7 gap-1 px-2" onClick={handleCopy}>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      Copy
                    </Button>
                  </div>

                  <div className="grid w-full grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={handleDownloadQr}>
                      <Download className="h-4 w-4" aria-hidden="true" />
                      Download QR
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={handlePrint}>
                      <Printer className="h-4 w-4" aria-hidden="true" />
                      Print ID
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="col-span-2 gap-1.5 text-secondary-600"
                      onClick={clearActiveShare}
                    >
                      <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                      Create a new share
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-center text-xs leading-relaxed text-primary-900/80">
                    The QR code contains only a secret link — not your data. Whoever scans it
                    sees <em>only</em> the fields you tick, until the share expires or you
                    revoke it.
                  </p>
                  <Select
                    label="Link valid for"
                    value={String(durationHours)}
                    onChange={(event) => setDurationHours(Number(event.target.value))}
                    disabled={creating}
                  >
                    {SHARE_DURATIONS.map((duration) => (
                      <option key={duration.hours} value={String(duration.hours)}>
                        {duration.label}
                      </option>
                    ))}
                  </Select>
                  <Button
                    className="w-full gap-2"
                    onClick={handleGenerate}
                    disabled={!isAuthenticated || !profileExists || creating}
                    loading={creating}
                  >
                    <QrCode className="h-4 w-4" aria-hidden="true" />
                    Generate QR code
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Live shares */}
          <div className="mt-4 rounded-2xl border border-secondary-200 bg-white p-5 sm:p-6">
            <h4 className="text-sm font-semibold text-secondary-900">Active shares</h4>
            {!sharesLoaded ? (
              <div className="mt-3 space-y-2" aria-hidden="true">
                <div className="h-14 animate-pulse rounded-xl bg-secondary-100" />
              </div>
            ) : shares.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-secondary-300 bg-secondary-50 p-3 text-xs text-secondary-500">
                No active shares. Generate a QR code above to let a responder view the fields
                you choose.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {shares.map((share) => (
                  <li
                    key={share.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-secondary-200 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-secondary-900">
                        {`${Object.keys(share.payload ?? {}).length} ${
                          Object.keys(share.payload ?? {}).length === 1 ? 'field' : 'fields'
                        } shared`}
                      </p>
                      <p className="text-xs text-secondary-500">
                        Expires {formatDate(share.expires_at)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1.5"
                      onClick={() =>
                        setRevokeTarget({
                          id: share.id || share.token,
                          label: `${Object.keys(share.payload ?? {}).length} field share`,
                        })
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Revoke
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        title="Revoke this share?"
        description="Anyone holding the QR link will immediately lose access to the shared fields. This cannot be undone — generate a new share if you need to share again."
        confirmLabel="Revoke access"
        variant="destructive"
        onCancel={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
      />
    </>
  )
}
