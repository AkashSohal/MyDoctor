'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useDoctorCompare, MAX_COMPARE_DOCTORS } from '@/lib/hooks/useDoctorCompare'
import { formatDoctorName } from '@/lib/utils/doctor'
import { ArrowRight, GitCompare, Trash2, X } from 'lucide-react'

// The comparison tray is a patient-facing tool — keep it out of account,
// auth and admin surfaces.
const HIDDEN_PREFIXES = ['/admin', '/dashboard', '/auth', '/doctor']

export function CompareBar() {
  const { doctors, count, remove, clear } = useDoctorCompare()
  const router = useRouter()
  const pathname = usePathname()

  if (count === 0) return null
  if (pathname && HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null
  }

  const canCompare = count >= 2
  const remaining = MAX_COMPARE_DOCTORS - count

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-4 sm:pb-4"
      role="region"
      aria-label="Doctor comparison"
    >
      <div className="mx-auto max-w-6xl rounded-2xl border border-secondary-200 bg-white/95 shadow-card backdrop-blur">
        <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
          {/* Count indicator */}
          <div className="flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
              <GitCompare className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-secondary-900">
                Compare doctors{' '}
                <span className="text-primary-600">
                  {count}/{MAX_COMPARE_DOCTORS}
                </span>
              </p>
              <p className="text-xs text-secondary-500">
                {canCompare ? 'Ready to compare' : `Select ${remaining} more to compare`}
              </p>
            </div>
          </div>

          {/* Selected doctors */}
          <ul className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 sm:pb-0">
            {doctors.map((doctor) => (
              <li
                key={doctor.id}
                className="flex shrink-0 items-center gap-2 rounded-xl border border-secondary-200 bg-secondary-50 py-1 pl-1 pr-2"
              >
                <Avatar src={doctor.photo_url ?? undefined} fallback={doctor.full_name} size="sm" />
                <div className="min-w-0 leading-tight">
                  <p className="max-w-[9rem] truncate text-xs font-medium text-secondary-900">
                    {formatDoctorName(doctor.full_name)}
                  </p>
                  {doctor.specialization_name && (
                    <p className="max-w-[9rem] truncate text-[11px] text-secondary-500">
                      {doctor.specialization_name}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(doctor.id)}
                  aria-label={`Remove ${formatDoctorName(doctor.full_name)} from comparison`}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-secondary-400 transition-colors hover:bg-secondary-200 hover:text-secondary-700"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={clear} className="gap-1.5 text-secondary-600">
              <Trash2 className="h-3.5 w-3.5" />
              Clear all
            </Button>
            <Button
              size="sm"
              disabled={!canCompare}
              onClick={() => router.push('/compare')}
              className="gap-1.5"
              title={canCompare ? 'Compare selected doctors' : 'Select at least 2 doctors to compare'}
            >
              Compare now
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
