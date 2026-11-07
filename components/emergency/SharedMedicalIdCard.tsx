import * as React from 'react'
import { AlertTriangle, IdCard, ShieldCheck } from 'lucide-react'
import type { MedicalIdSharePayload } from '@/lib/emergency/medicalId'

interface SharedMedicalIdCardProps {
  payload: MedicalIdSharePayload
  expiresAt?: string | null
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
 * Read-only presentation of a shared emergency medical ID payload.
 * Shows ONLY the keys present in the payload — anything the patient did not
 * select simply does not exist in the snapshot. Safe to render on a public
 * page because the database never returns anything else for this token.
 */
export function SharedMedicalIdCard({ payload, expiresAt }: SharedMedicalIdCardProps) {
  const rows: Array<{ label: string; value: string }> = []

  if (payload.name) rows.push({ label: 'Patient name', value: payload.name })
  if (payload.bloodGroup) rows.push({ label: 'Blood group', value: payload.bloodGroup })
  if (payload.allergies) rows.push({ label: 'Known allergies', value: payload.allergies })
  if (payload.conditions) rows.push({ label: 'Medical conditions', value: payload.conditions })
  const contact = [payload.emergencyContactName, payload.emergencyContactPhone]
    .filter(Boolean)
    .join(' · ')
  if (contact) rows.push({ label: 'Emergency contact', value: contact })

  return (
    <div className="w-full max-w-lg rounded-3xl border border-secondary-200 bg-white p-6 shadow-soft sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-lg font-bold text-secondary-900">
          <IdCard className="h-5 w-5 text-primary-600" aria-hidden="true" />
          Shared Emergency Medical ID
        </h1>
        <span className="rounded-full bg-red-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-red-700">
          Emergency use
        </span>
      </div>

      <dl className="mt-5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-start justify-between gap-4 border-t border-secondary-100 py-3 first:border-t-0"
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

      <div className="mt-5 space-y-3 rounded-2xl bg-secondary-50 p-4 text-xs leading-relaxed text-secondary-600">
        <p className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-600" aria-hidden="true" />
          Shared voluntarily by the patient through MyDoctor. Only the fields shown above were
          selected for sharing — nothing else is included.
        </p>
        {expiresAt && (
          <p className="text-secondary-500">This share expires on {formatDate(expiresAt)}.</p>
        )}
        <p className="flex items-start gap-2 text-amber-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          MyDoctor does not verify, endorse or diagnose from this information. It is not medical
          advice. In an emergency, call 112 first.
        </p>
      </div>
    </div>
  )
}
