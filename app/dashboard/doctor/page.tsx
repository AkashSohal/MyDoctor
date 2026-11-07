import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { DoctorDashboardClient } from './DoctorDashboardClient'
import type { HospitalAffiliation } from '@/lib/hospitals'

export const metadata: Metadata = {
  title: 'Doctor Dashboard | MyDoctor',
  description: 'Manage your profile, availability, and appointments.',
}

export const dynamic = 'force-dynamic'

export default async function DoctorDashboardPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/login?redirect=/dashboard/doctor')
  }

  const { data: roleProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (roleProfile?.role !== 'doctor') {
    redirect('/')
  }

  const { data: doctor } = await supabase
    .from('doctors')
    .select(`
      *,
      specialization:specialties(id, name)
    `)
    .eq('user_id', user.id)
    .single()

  if (!doctor) {
    redirect('/doctor/onboarding')
  }

  const [
    { data: appointments },
    { data: availability },
    { data: hospitals },
    { data: affiliations },
    { data: accountProfile },
    { data: specialties }
  ] = await Promise.all([
    supabase
      .from('appointments')
      .select(`
        *,
        patient:profiles(full_name, phone, email, avatar_url),
        hospital:hospitals(name, address)
      `)
      .eq('doctor_id', doctor.id)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })
      .limit(20),
    supabase
      .from('availability')
      .select(`
        *,
        hospital:hospitals(name)
      `)
      .eq('doctor_id', doctor.id)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true }),
    supabase
      .from('hospitals')
      .select(
        'id, name, address, latitude, longitude, phone, website, email, city, state, pin_code, hospital_type, verification_status, is_active, added_by, created_at'
      )
      .order('name'),
    supabase
      .from('doctor_hospitals')
      .select(`
        id,
        doctor_id,
        hospital_id,
        created_at,
        hospital:hospitals(
          id, name, address, latitude, longitude, phone, website, email,
          city, state, pin_code, hospital_type, verification_status, is_active, added_by, created_at
        )
      `)
      .eq('doctor_id', doctor.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('profiles')
      .select('full_name, phone, email, avatar_url')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('specialties')
      .select('id, name')
      .order('name'),
  ])

  return (
    <DoctorDashboardClient
      doctor={doctor}
      appointments={appointments || []}
      availability={availability || []}
      hospitals={hospitals || []}
      affiliations={
        (affiliations || []).filter(
          (item) => Boolean(item.hospital)
        ) as unknown as HospitalAffiliation[]
      }
      specialties={specialties || []}
      profile={
        accountProfile || { full_name: null, phone: null, email: user.email ?? null }
      }
      userId={user.id}
    />
  )
}