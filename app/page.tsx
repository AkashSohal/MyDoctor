import { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/utils/supabase/public'
import { formatTime } from '@/lib/utils'
import { HeroSection } from '@/components/home/HeroSection'
import { StatsBar, PlatformStats } from '@/components/home/StatsBar'
import { SpecialtyGrid } from '@/components/home/SpecialtyGrid'
import { buildSpecialtyCards, SpecialtyRow } from '@/components/home/specialtyCards'
import { NearbyDoctors } from '@/components/home/NearbyDoctors'
import { TrustSection } from '@/components/home/TrustSection'
import { HowItWorksSection } from '@/components/home/HowItWorksSection'
import { HospitalsSection, HospitalCardData } from '@/components/home/HospitalsSection'
import { FinalCtaSection } from '@/components/home/FinalCtaSection'
import { FeaturedDoctor } from '@/components/home/DoctorVisual'

// Public, non-personalized data — serve from cache and revalidate in background.
export const revalidate = 120

export const metadata: Metadata = {
  title: 'MyDoctor — Find the Right Doctor, Right Near You',
  description:
    'Discover trusted doctors and specialists near you, explore their qualifications and availability, and book your medical appointment with confidence.',
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface AvailabilitySlot {
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

function getNextAvailabilitySlot(slots?: AvailabilitySlot[] | null) {
  if (!slots || slots.length === 0) return null

  const now = new Date()
  const today = now.getDay()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + (m || 0)
  }

  for (let offset = 0; offset < 7; offset++) {
    const day = (today + offset) % 7
    const candidates = slots
      .filter((slot) => slot.is_active && slot.day_of_week === day)
      .filter((slot) => (offset === 0 ? toMinutes(slot.start_time) >= nowMinutes : true))
      .sort((a, b) => a.start_time.localeCompare(b.start_time))

    if (candidates.length > 0) {
      const label = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : DAY_LABELS[day]
      return { dayLabel: label, time: formatTime(candidates[0].start_time) }
    }
  }

  return null
}

const getHomeData = unstable_cache(
  async () => {
    const specialtiesRows: SpecialtyRow[] = []
    const hospitalsData: HospitalCardData[] = []
    const doctorOptions: { id: string; name: string }[] = []
    let stats: PlatformStats | null = null
    let featured: Omit<FeaturedDoctor, 'nextSlot'> & { availability?: AvailabilitySlot[] } | null = null

    try {
      const supabase = createPublicClient()

      const [specialtiesRes, doctorsRes, hospitalsRes, verifiedCountRes, hospitalCountRes, specialtyCountRes] =
        await Promise.all([
          supabase
            .from('specialties')
            .select('id, name, doctors:doctors(count)')
            .order('name'),
          supabase
            .from('doctors')
            .select(`
              id,
              full_name,
              photo_url,
              qualifications,
              experience_years,
              consultation_fee,
              verification_status,
              rating_average,
              verified_review_count,
              specialization:specialties(name),
              availability(id, day_of_week, start_time, end_time, is_active)
            `)
            .eq('verification_status', 'verified')
            .order('rating_average', { ascending: false })
            .order('verified_review_count', { ascending: false })
            .limit(4),
          supabase
            .from('hospitals')
            .select('id, name, address, phone, website, latitude, longitude, doctors:doctor_hospitals(count)')
            .order('name')
            .limit(6),
          supabase
            .from('doctors')
            .select('id', { count: 'exact', head: true })
            .eq('verification_status', 'verified'),
          supabase.from('hospitals').select('id', { count: 'exact', head: true }),
          supabase.from('specialties').select('id', { count: 'exact', head: true }),
        ])

      if (!specialtiesRes.error && specialtiesRes.data) {
        for (const row of specialtiesRes.data) {
          const count = Array.isArray(row.doctors) ? row.doctors[0]?.count : undefined
          specialtiesRows.push({ id: row.id, name: row.name, doctorCount: count ?? 0 })
          doctorOptions.push({ id: row.id, name: row.name })
        }
      }

      if (!doctorsRes.error && doctorsRes.data && doctorsRes.data.length > 0) {
        const top = doctorsRes.data[0]
        featured = {
          id: top.id,
          fullName: top.full_name,
          photoUrl: top.photo_url,
          specialization: Array.isArray(top.specialization)
            ? top.specialization[0]?.name
            : (top.specialization as { name?: string } | null)?.name,
          qualifications: top.qualifications,
          experienceYears: top.experience_years,
          consultationFee: top.consultation_fee,
          verificationStatus: top.verification_status,
          availability: top.availability,
        }
      }

      if (!hospitalsRes.error && hospitalsRes.data) {
        for (const row of hospitalsRes.data) {
          hospitalsData.push({
            id: row.id,
            name: row.name,
            address: row.address,
            phone: row.phone,
            website: row.website,
            latitude: row.latitude,
            longitude: row.longitude,
            doctorCount: Array.isArray(row.doctors) ? row.doctors[0]?.count : 0,
          })
        }
      }

      const verifiedDoctors = verifiedCountRes.error ? null : verifiedCountRes.count
      const hospitals = hospitalCountRes.error ? null : hospitalCountRes.count
      const specialties = specialtyCountRes.error ? null : specialtyCountRes.count

      if (verifiedDoctors || hospitals || specialties) {
        stats = { verifiedDoctors, hospitals, specialties }
      }
    } catch (error) {
      console.error('Homepage data fetch failed:', error)
    }

    return { specialtiesRows, doctorOptions, hospitalsData, stats, featured }
  },
  ['home-data'],
  { revalidate: 120, tags: ['home'] }
)

export default async function HomePage() {
  const { specialtiesRows, doctorOptions, hospitalsData, stats, featured } = await getHomeData()
  const specialtyCards = buildSpecialtyCards(specialtiesRows)
  const featuredDoctor: FeaturedDoctor | null = featured
    ? { ...featured, nextSlot: getNextAvailabilitySlot(featured.availability) }
    : null

  return (
    <div className="min-h-screen">
      <HeroSection specialties={doctorOptions} featuredDoctor={featuredDoctor} />

      <StatsBar stats={stats} />

      <SpecialtyGrid items={specialtyCards} />

      <NearbyDoctors specialties={doctorOptions} />

      <TrustSection />

      <HowItWorksSection />

      <HospitalsSection hospitals={hospitalsData} />

      <FinalCtaSection />

      <section className="border-t border-secondary-200 bg-secondary-100 py-8">
        <div className="container">
          <p className="mx-auto max-w-4xl text-sm leading-relaxed text-secondary-600">
            <strong className="text-secondary-900">Medical Disclaimer:</strong> MyDoctor helps
            patients discover and compare healthcare providers. Information is provided for
            informational purposes only. Please verify doctor credentials, availability, and
            consultation details with the doctor or hospital before visiting. MyDoctor does not
            provide medical advice, diagnosis, or treatment.
          </p>
        </div>
      </section>
    </div>
  )
}
