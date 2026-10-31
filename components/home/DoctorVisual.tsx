import * as React from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, CalendarClock, ShieldCheck, BadgeIndianRupee, GraduationCap } from 'lucide-react'

export interface FeaturedDoctor {
  id: string
  fullName: string
  photoUrl?: string | null
  specialization?: string | null
  qualifications?: string[] | null
  experienceYears?: number | null
  consultationFee?: number | null
  verificationStatus?: string | null
  nextSlot?: { dayLabel: string; time: string } | null
}

function DoctorIllustration() {
  return (
    <svg
      viewBox="0 0 420 460"
      className="h-full w-full"
      role="img"
      aria-label="Illustration of a doctor ready to help patients"
    >
      <defs>
        <linearGradient id="hv-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="55%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#ccfbf1" />
        </linearGradient>
        <linearGradient id="hv-coat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#eef6ff" />
        </linearGradient>
      </defs>

      <rect x="20" y="20" width="380" height="420" rx="48" fill="url(#hv-bg)" />
      <circle cx="96" cy="96" r="10" fill="#14b8a6" opacity="0.35" />
      <circle cx="330" cy="130" r="14" fill="#16a34a" opacity="0.2" />
      <circle cx="308" cy="72" r="6" fill="#0ea5e9" opacity="0.35" />

      <rect x="58" y="330" width="304" height="70" rx="28" fill="#ffffff" opacity="0.7" />

      <g>
        <path
          d="M126 452c0-62 42-108 84-108s84 46 84 108"
          fill="url(#hv-coat)"
        />
        <path d="M178 348l32 34 32-34" fill="none" stroke="#0f172a" strokeOpacity="0.12" strokeWidth="6" strokeLinecap="round" />
        <path d="M210 382v70" stroke="#0f172a" strokeOpacity="0.1" strokeWidth="4" />
        <path d="M186 344c-6 22-8 44-6 66" stroke="#14b8a6" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M234 344c6 22 8 44 6 66" stroke="#14b8a6" strokeWidth="8" fill="none" strokeLinecap="round" />
        <circle cx="210" cy="416" r="14" fill="#0f172a" />
        <circle cx="210" cy="416" r="7" fill="#14b8a6" />

        <rect x="196" y="312" width="28" height="40" rx="12" fill="#f3c8a8" />

        <circle cx="210" cy="256" r="62" fill="#f3c8a8" />
        <path
          d="M148 250c0-40 28-70 62-70s62 30 62 70c0 6-2 10-6 10-6-24-28-40-56-40s-50 16-56 40c-4 0-6-4-6-10z"
          fill="#1f2937"
        />
        <circle cx="188" cy="258" r="6" fill="#1f2937" />
        <circle cx="232" cy="258" r="6" fill="#1f2937" />
        <path d="M196 286c8 8 20 8 28 0" stroke="#1f2937" strokeWidth="5" strokeLinecap="round" fill="none" />

        <path d="M172 322c10 10 24 16 38 16s28-6 38-16" fill="#14b8a6" />
        <rect x="252" y="356" width="34" height="46" rx="10" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="3" />
        <path d="M262 372h14M262 384h14" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" />
      </g>

      <g transform="translate(304 360)">
        <circle cx="28" cy="28" r="28" fill="#ffffff" />
        <path d="M28 16v24M16 28h24" stroke="#16a34a" strokeWidth="6" strokeLinecap="round" />
      </g>
    </svg>
  )
}

export function DoctorVisual({ doctor }: { doctor?: FeaturedDoctor | null }) {
  const isVerified = doctor?.verificationStatus === 'verified'

  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-gradient-to-br from-white via-sky-50 to-teal-50 shadow-float">
        <div className="aspect-[420/460] w-full">
          <DoctorIllustration />
        </div>
      </div>

      {doctor ? (
        <>
          <div className="absolute -left-2 top-8 w-[15rem] rounded-2xl border border-secondary-200/70 bg-white/95 p-4 shadow-float backdrop-blur sm:-left-6 sm:w-[17rem]">
            <div className="flex items-center gap-3">
              <Avatar src={doctor.photoUrl} fallback={doctor.fullName} size="lg" alt={doctor.fullName} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-secondary-900">Dr. {doctor.fullName}</p>
                <p className="truncate text-xs text-secondary-500">
                  {doctor.specialization || 'Specialist'}
                </p>
                {isVerified && (
                  <Badge variant="success" size="sm" className="mt-1 gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-secondary-600">
              {doctor.experienceYears != null && (
                <span className="rounded-lg bg-secondary-100 px-2 py-1">
                  {doctor.experienceYears} yrs exp
                </span>
              )}
              {doctor.consultationFee != null && (
                <span className="rounded-lg bg-secondary-100 px-2 py-1">
                  ₹{doctor.consultationFee} fee
                </span>
              )}
              {doctor.qualifications && doctor.qualifications.length > 0 && (
                <span className="flex items-center gap-1 rounded-lg bg-secondary-100 px-2 py-1">
                  <GraduationCap className="h-3 w-3" />
                  {doctor.qualifications[0]}
                </span>
              )}
            </div>
          </div>

          <div className="absolute -right-2 bottom-10 w-[14rem] rounded-2xl border border-secondary-200/70 bg-white/95 p-4 shadow-float backdrop-blur sm:-right-6 sm:w-[16rem]">
            {doctor.nextSlot ? (
              <>
                <div className="flex items-center gap-2 text-xs font-semibold text-teal-700">
                  <CalendarClock className="h-4 w-4" />
                  Next available
                </div>
                <p className="mt-1.5 text-sm font-semibold text-secondary-900">
                  {doctor.nextSlot.dayLabel}, {doctor.nextSlot.time}
                </p>
                <p className="mt-1 text-xs text-secondary-500">From the doctor&apos;s own schedule</p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-xs font-semibold text-teal-700">
                  <CalendarClock className="h-4 w-4" />
                  Appointments
                </div>
                <p className="mt-1.5 text-sm font-semibold text-secondary-900">
                  Booked from published schedules
                </p>
                <p className="mt-1 text-xs text-secondary-500">
                  Slots appear only when the doctor has shared them
                </p>
              </>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="absolute -left-2 top-10 w-[14.5rem] rounded-2xl border border-secondary-200/70 bg-white/95 p-4 shadow-float backdrop-blur sm:-left-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary-700">
              <ShieldCheck className="h-4 w-4" />
              Verified profiles
            </div>
            <p className="mt-1.5 text-sm font-semibold text-secondary-900">
              Badge only after credential review
            </p>
            <p className="mt-1 text-xs text-secondary-500">
              Registration details are checked by the platform team
            </p>
          </div>

          <div className="absolute -right-2 bottom-12 w-[13.5rem] rounded-2xl border border-secondary-200/70 bg-white/95 p-4 shadow-float backdrop-blur sm:-right-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-700">
              <BadgeIndianRupee className="h-4 w-4" />
              Transparent fees
            </div>
            <p className="mt-1.5 text-sm font-semibold text-secondary-900">
              Consultation fee shown upfront
            </p>
            <p className="mt-1 text-xs text-secondary-500">No surprises at the clinic</p>
          </div>
        </>
      )}
    </div>
  )
}
