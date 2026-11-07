'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  ClipboardList,
  PhoneCall,
  QrCode,
  Siren,
  Users,
  Hospital as HospitalIcon,
  Info,
} from 'lucide-react'
import { SosButton } from '@/components/emergency/SosButton'
import {
  EmergencyCallActions,
  EmergencyContactCallButton,
} from '@/components/emergency/CallButtons'
import { NearbyEmergencyHospitals } from '@/components/emergency/NearbyEmergencyHospitals'
import { EmergencyContactsSection } from '@/components/emergency/EmergencyContactsSection'
import { LocationShare } from '@/components/emergency/LocationShare'
import { MedicalInfoSection } from '@/components/emergency/MedicalInfoSection'
import { MedicalIdSection } from '@/components/emergency/MedicalIdSection'
import { FirstAidGuide } from '@/components/emergency/FirstAidGuide'
import { useEmergencyContacts } from '@/lib/emergency/storage'
import { useEmergencyProfile } from '@/lib/emergency/useEmergencyProfile'
import { useEmergencyMedicalId } from '@/lib/emergency/medicalId'
import { CALL_DISCLAIMER, EMERGENCY_SERVICES_NUMBER, AMBULANCE_NUMBER } from '@/lib/emergency'
import type { PublicHospital } from '@/lib/hospitals/list'
import { cn } from '@/lib/utils'

interface EmergencyDashboardProps {
  hospitals: PublicHospital[]
}

const QUICK_ACCESS = [
  {
    id: 'nearby-hospitals',
    title: 'Nearby Emergency Hospitals',
    description: 'Sort verified hospitals by distance and get directions.',
    icon: HospitalIcon,
    accent: 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white',
  },
  {
    id: 'emergency-contacts',
    title: 'My Emergency Contacts',
    description: 'Save the people to call and share your location with.',
    icon: Users,
    accent: 'bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white',
  },
  {
    id: 'medical-information',
    title: 'Medical Information',
    description: 'Blood group, allergies and conditions for responders.',
    icon: Activity,
    accent: 'bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white',
  },
  {
    id: 'medical-id',
    title: 'Digital Medical ID',
    description: 'Generate a revocable QR code with the fields you choose.',
    icon: QrCode,
    accent: 'bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white',
  },
  {
    id: 'first-aid',
    title: 'First Aid Guide',
    description: 'Step-by-step help for burns, bleeding, CPR and more.',
    icon: ClipboardList,
    accent: 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white',
  },
] as const

export function EmergencyDashboard({ hospitals }: EmergencyDashboardProps) {
  const contactsApi = useEmergencyContacts()
  const profileApi = useEmergencyProfile()
  const medicalIdApi = useEmergencyMedicalId()

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Hero — emergency actions are visible without scrolling */}
      <section className="border-b border-secondary-200 bg-gradient-to-b from-white via-white to-primary-50/40">
        <div className="container pb-8 pt-8 sm:pb-10 sm:pt-10">
          <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-red-700">
                <Siren className="h-3.5 w-3.5" aria-hidden="true" />
                Emergency Assistance
              </span>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-secondary-900 sm:text-4xl">
                Help is one tap away
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-secondary-600 sm:text-base">
                {CALL_DISCLAIMER} MyDoctor does not dispatch ambulances or notify services on your behalf.
              </p>
              <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-medium text-primary-800">
                <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
                India: dial 112 for any emergency · 108 ambulance where available
              </p>
            </div>

            {/* SOS + primary call actions */}
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center lg:flex-col xl:flex-row">
              <SosButton contacts={contactsApi.contacts} variant="hero" />
              <div className="grid w-full max-w-sm gap-2.5 sm:w-auto">
                <EmergencyCallActions className="grid gap-2.5" size="lg" />
                <EmergencyContactCallButton contacts={contactsApi.contacts} size="lg" className="w-full justify-start sm:justify-center" />
              </div>
            </div>
          </div>

          {/* Quick access */}
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-secondary-500">
            <span className="h-px w-6 bg-secondary-300" aria-hidden="true" />
            Quick Access
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {QUICK_ACCESS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={cn(
                  'group flex items-start gap-3 rounded-2xl border border-secondary-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-soft'
                )}
              >
                <span
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors',
                    item.accent
                  )}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 text-sm font-semibold text-secondary-900">
                    <span className="truncate">{item.title}</span>
                    <ArrowRight
                      className="h-3.5 w-3.5 shrink-0 text-secondary-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-600"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-secondary-500">
                    {item.description}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Nearby emergency hospitals */}
      <section id="nearby-hospitals" className="section scroll-mt-24 bg-white">
        <div className="container">
          <SectionHeading
            icon={<HospitalIcon className="h-5 w-5 text-red-600" aria-hidden="true" />}
            title="Find Nearby Emergency Hospitals"
            description="Verified hospitals from the MyDoctor network — share your position to sort them by distance."
          />
          <NearbyEmergencyHospitals hospitals={hospitals} />
        </div>
      </section>

      {/* Emergency contacts */}
      <section id="emergency-contacts" className="section scroll-mt-24 bg-secondary-50">
        <div className="container">
          <SectionHeading
            icon={<Users className="h-5 w-5 text-primary-600" aria-hidden="true" />}
            title="My Emergency Contacts"
            description="The people who should hear from you first — one tap to call, one tap to share your location."
          />
          <EmergencyContactsSection {...contactsApi} heading="Saved contacts" />
          <div className="mt-6">
            <LocationShare contacts={contactsApi.contacts} />
          </div>
        </div>
      </section>

      {/* Medical information */}
      <section id="medical-information" className="section scroll-mt-24 bg-white">
        <div className="container">
          <SectionHeading
            icon={<Activity className="h-5 w-5 text-primary-600" aria-hidden="true" />}
            title="My Emergency Medical Information"
            description="What a responder needs to know about you in the first minute — saved privately to your MyDoctor account."
          />
          <MedicalInfoSection {...profileApi} />
        </div>
      </section>

      {/* Digital emergency medical ID */}
      <section id="medical-id" className="section scroll-mt-24 bg-secondary-50">
        <div className="container">
          <SectionHeading
            icon={<QrCode className="h-5 w-5 text-primary-600" aria-hidden="true" />}
            title="Digital Emergency Medical ID"
            description="Choose which fields a responder may see, generate a QR code, and revoke access whenever you want."
          />
          <MedicalIdSection
            {...medicalIdApi}
            profile={profileApi.profile}
            profileLoaded={profileApi.loaded}
            profileExists={profileApi.exists}
          />
        </div>
      </section>

      {/* First aid guide */}
      <section id="first-aid" className="section scroll-mt-24 bg-white">
        <div className="container">
          <SectionHeading
            icon={<ClipboardList className="h-5 w-5 text-red-600" aria-hidden="true" />}
            title="First Aid Guide"
            description="Clear steps for the most common emergencies. This is general guidance — always call 112 for serious situations."
          />
          <FirstAidGuide />

          <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-red-200 bg-red-50 p-6 text-center sm:flex-row sm:text-left">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
              <PhoneCall className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <p className="font-semibold text-red-900">Not sure what to do? Call first.</p>
              <p className="text-sm text-red-700">
                Emergency Services: <strong className="tabular-nums">{EMERGENCY_SERVICES_NUMBER}</strong> ·
                Ambulance: <strong className="tabular-nums">{AMBULANCE_NUMBER}</strong> (where available)
              </p>
            </div>
            <Link
              href="/hospitals"
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
            >
              Browse hospitals
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function SectionHeading({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="mb-6 max-w-3xl">
      <h2 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-secondary-900 sm:text-3xl">
        {icon}
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-secondary-600 sm:text-base">{description}</p>
    </div>
  )
}
