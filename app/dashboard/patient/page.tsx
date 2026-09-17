import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { PatientDashboardClient } from './PatientDashboardClient'

export const metadata: Metadata = {
  title: 'Patient Dashboard | MediNear',
  description: 'Manage your appointments, reviews, and saved doctors.',
}

export const dynamic = 'force-dynamic'

export default async function PatientDashboardPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/login?redirect=/dashboard/patient')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'patient') {
    redirect('/')
  }

  // Fetch patient data
  const [
    { data: upcomingAppointments },
    { data: pastAppointments },
    { data: savedDoctors },
    { data: reviews }
  ] = await Promise.all([
    supabase
      .from('appointments')
      .select(`
        *,
        doctor:doctors(full_name, photo_url, specialization:specialties(name), consultation_fee),
        hospital:hospitals(name, address)
      `)
      .eq('patient_id', user.id)
      .in('status', ['pending', 'confirmed'])
      .gte('appointment_date', new Date().toISOString().split('T')[0])
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })
      .limit(5),
    supabase
      .from('appointments')
      .select(`
        *,
        doctor:doctors(full_name, photo_url, specialization:specialties(name)),
        hospital:hospitals(name, address)
      `)
      .eq('patient_id', user.id)
      .in('status', ['completed', 'cancelled', 'rejected'])
      .order('appointment_date', { ascending: false })
      .limit(5),
    supabase
      .from('saved_doctors')
      .select(`
        doctor:doctors(
          id, full_name, photo_url, specialization:specialties(name),
          experience_years, rating_average, rating_count, consultation_fee,
          verification_status, distance_km
        )
      `)
      .eq('patient_id', user.id)
      .limit(5),
    supabase
      .from('reviews')
      .select(`
        *,
        doctor:doctors(full_name, specialization:specialties(name))
      `)
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return (
    <PatientDashboardClient
      user={user}
      upcomingAppointments={upcomingAppointments || []}
      pastAppointments={pastAppointments || []}
      savedDoctors={(savedDoctors || []).map((s: any) => {
        const doc = s.doctor
        if (!doc) return null
        return {
          ...doc,
          specialization: doc.specialization ? { name: doc.specialization.name } : null,
        }
      }).filter(Boolean)}
      reviews={reviews || []}
    />
  )
}