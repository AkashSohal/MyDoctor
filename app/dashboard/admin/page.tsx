import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { AdminDashboardClient } from './AdminDashboardClient'

export const metadata: Metadata = {
  title: 'Admin Dashboard | MediNear',
  description: 'Manage doctors, reviews, hospitals, and platform settings.',
}

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/login?redirect=/dashboard/admin')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  const [
    { count: totalUsers },
    { count: totalDoctors },
    { count: pendingDoctors },
    { count: totalAppointments },
    { count: pendingReviews },
    { count: reportedReviews },
    { data: recentDoctors },
    { data: recentAppointments },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
    supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    supabase.from('appointments').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('status', 'pending_moderation'),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('status', 'reported'),
    supabase
      .from('doctors')
      .select('id, full_name, specialization:specialties(name), verification_status, created_at, rating_average')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('appointments')
      .select(`
        id, status, appointment_date, appointment_time,
        doctor:doctors(full_name),
        patient:users(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  // Transform recentDoctors to match expected type
  const transformedDoctors = (recentDoctors || []).map((d: any) => ({
    ...d,
    specialization: d.specialization ? { name: d.specialization.name } : null,
  }))

  return (
    <AdminDashboardClient
      stats={{
        totalUsers: totalUsers || 0,
        totalDoctors: totalDoctors || 0,
        pendingDoctors: pendingDoctors || 0,
        totalAppointments: totalAppointments || 0,
        pendingReviews: pendingReviews || 0,
        reportedReviews: reportedReviews || 0,
      }}
      recentDoctors={transformedDoctors}
      recentAppointments={(recentAppointments || []).map((a: any) => ({
        ...a,
        doctor: a.doctor ? { full_name: a.doctor.full_name } : null,
        patient: a.patient ? { full_name: a.patient.full_name } : null,
      }))}
    />
  )
}