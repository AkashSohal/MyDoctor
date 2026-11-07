import { Metadata } from 'next'
import { EmergencyDashboard } from '@/components/emergency/EmergencyDashboard'
import { getHospitalList, type PublicHospital } from '@/lib/hospitals/list'

export const metadata: Metadata = {
  title: 'Emergency Assistance & SOS | MyDoctor',
  description:
    'Emergency SOS, call 112, call an ambulance, share your location, find nearby emergency hospitals, save emergency contacts and read the first aid guide.',
  robots: 'index, follow',
}

// Same public-data cache policy as the hospitals directory.
export const revalidate = 300

export default async function EmergencyPage() {
  let hospitals: PublicHospital[] = []
  try {
    hospitals = await getHospitalList()
  } catch (error) {
    // Never let a data fetch take the emergency screen down.
    console.error('[MyDoctor] Emergency page could not load hospitals:', error)
  }

  return <EmergencyDashboard hospitals={hospitals} />
}
