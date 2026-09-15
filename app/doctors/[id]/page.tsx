import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { DoctorProfileClient } from './DoctorProfileClient'

interface Props {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  
  const { data: doctor } = await supabase
    .from('doctors')
    .select(`
      full_name,
      specialization:specialties!specialization_id(name),
      qualifications,
      bio,
      verification_status
    `)
    .eq('id', id)
    .eq('verification_status', 'verified')
    .single()

  if (!doctor) {
    return { title: 'Doctor Not Found | MediNear' }
  }

  // Handle specialization - Supabase returns it as an array
  const specialization = Array.isArray(doctor.specialization) 
    ? doctor.specialization[0] 
    : doctor.specialization
  
  const title = `Dr. ${doctor.full_name} | ${specialization?.name || 'Specialist'} | MediNear`
  const description = doctor.bio || `Book an appointment with Dr. ${doctor.full_name}, ${specialization?.name || 'Specialist'}. Verified doctor with ${doctor.qualifications?.join(', ') || 'medical qualifications'}.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
    },
  }
}

export default async function DoctorProfilePage({ params }: Props) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: doctor, error } = await supabase
    .from('doctors')
    .select(`
      *,
      specialization:specialties(id, name, description),
      hospitals:hospitals(id, name, address, latitude, longitude, phone, website),
      availability(*)
    `)
    .eq('id', id)
    .eq('verification_status', 'verified')
    .single()

  if (error || !doctor) {
    notFound()
  }

  return <DoctorProfileClient doctor={doctor} />
}