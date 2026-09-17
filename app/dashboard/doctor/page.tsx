import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { DoctorDashboardClient } from './DoctorDashboardClient'

export const metadata: Metadata = {
  title: 'Doctor Dashboard | MediNear',
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

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'doctor') {
    redirect('/')
  }

  const { data: doctor } = await supabase
    .from('doctors')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!doctor) {
    redirect('/doctor/onboarding')
  }

  const [
    { data: appointments },
    { data: availability },
    { data: hospitals }
  ] = await Promise.all([
    supabase
      .from('appointments')
      .select(`
        *,
        patient:users(full_name, phone, email, avatar_url),
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
      .select('*')
      .order('name'),
  ])

  return (
    <DoctorDashboardClient
      doctor={doctor}
      appointments={appointments || []}
      availability={availability || []}
      hospitals={hospitals || []}
    />
  )
}