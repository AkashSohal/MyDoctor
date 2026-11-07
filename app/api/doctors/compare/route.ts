import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { DOCTOR_SEARCH_COLUMNS } from '@/lib/doctors/columns'
import { getSafeBio } from '@/lib/utils/doctor'

export const dynamic = 'force-dynamic'

const COMPARE_CACHE_HEADER = 'public, s-maxage=30, stale-while-revalidate=60'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_COMPARE_IDS = 3

/**
 * Returns full directory records for the doctors selected for comparison.
 * Only verified doctors are returned (RLS enforces this as well), and the
 * response shape matches /api/doctors/search so the comparison view can reuse
 * the same rendering helpers.
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const searchParams = request.nextUrl.searchParams

    const ids = (searchParams.get('ids') || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)

    if (ids.length === 0) {
      return NextResponse.json({ doctors: [] }, { headers: { 'Cache-Control': COMPARE_CACHE_HEADER } })
    }

    if (ids.length > MAX_COMPARE_IDS || ids.some((id) => !UUID_RE.test(id))) {
      return NextResponse.json({ error: 'Invalid doctor selection.' }, { status: 400 })
    }

    const uniqueIds = Array.from(new Set(ids))
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')
    const hasLocation = Boolean(lat && lng)

    const { data, error } = await supabase
      .from('doctors')
      .select(DOCTOR_SEARCH_COLUMNS)
      .in('id', uniqueIds)
      .eq('verification_status', 'verified')

    if (error) {
      console.error('Doctor compare error:', error)
      return NextResponse.json({ error: 'Could not load the selected doctors. Please try again.' }, { status: 500 })
    }

    const rows = (data ?? []) as any[]

    // Single query for hospital affiliations (no N+1).
    const doctorIds = rows.map((d) => d.id)
    let doctorHospitals: Array<{ doctor_id: string; hospital: any }> = []
    if (doctorIds.length > 0) {
      const { data: links } = await supabase
        .from('doctor_hospitals')
        .select(
          'doctor_id, hospital:hospitals(id, name, address, latitude, longitude, phone, verification_status, is_active)'
        )
        .in('doctor_id', doctorIds)
      doctorHospitals = (links ?? []) as Array<{ doctor_id: string; hospital: any }>
    }

    const doctors = rows.map((doctor) => {
      const hospitals = doctorHospitals
        .filter(
          (dh) =>
            dh.doctor_id === doctor.id &&
            dh.hospital?.verification_status === 'verified' &&
            dh.hospital.is_active !== false
        )
        .map((dh) => dh.hospital)

      let distance_km: number | undefined
      if (hasLocation && doctor.latitude && doctor.longitude) {
        const R = 6371
        const dLat = ((doctor.latitude - lat) * Math.PI) / 180
        const dLng = ((doctor.longitude - lng) * Math.PI) / 180
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat * Math.PI) / 180) *
            Math.cos((doctor.latitude * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        distance_km = Math.round(R * c * 10) / 10
      }

      return {
        ...doctor,
        bio: getSafeBio(doctor.bio),
        hospitals,
        ...(distance_km !== undefined ? { distance_km } : {}),
      }
    })

    // Preserve the order the user selected the doctors in.
    const ordered = uniqueIds
      .map((id) => doctors.find((d) => d.id === id))
      .filter(Boolean)

    return NextResponse.json(
      { doctors: ordered },
      { headers: { 'Cache-Control': COMPARE_CACHE_HEADER } }
    )
  } catch (error) {
    console.error('Compare API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
