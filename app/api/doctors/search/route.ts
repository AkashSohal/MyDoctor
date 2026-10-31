import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Search results contain only public directory data (no user/private rows),
// so responses may be shared-cached briefly at the CDN/edge.
export const dynamic = 'force-dynamic'

const SEARCH_CACHE_HEADER = 'public, s-maxage=30, stale-while-revalidate=60'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const DOCTOR_SEARCH_COLUMNS = `
  id,
  user_id,
  full_name,
  photo_url,
  bio,
  qualifications,
  specialization_id,
  experience_years,
  gender,
  languages,
  consultation_fee,
  latitude,
  longitude,
  address,
  medical_registration_number,
  registration_council,
  verification_status,
  rating_average,
  rating_count,
  verified_review_count,
  profile_completion_percentage,
  created_at,
  updated_at,
  specialization:specialties(name),
  availability(id, doctor_id, hospital_id, day_of_week, start_time, end_time, is_active)
`

function sanitizeQuery(q: string): string {
  return q.replace(/[,(){}"'\\]/g, ' ').trim().slice(0, 100)
}

// Map raw PostgREST/database failures to messages that are safe and useful
// for end users. Implementation details stay in the server logs only.
function describeSearchError(error: { message?: string } | null): string {
  const message = (error?.message || '').toLowerCase()
  if (
    message.includes("could not find the table") ||
    message.includes('schema cache') ||
    message.includes('does not exist') ||
    message.includes('permission denied') ||
    message.includes('invalid api key')
  ) {
    return 'Doctor directory is temporarily unavailable. Please try again later.'
  }
  if (message.includes('timeout') || message.includes('socket') || message.includes('fetch failed')) {
    return 'The search service timed out. Please try again.'
  }
  return 'Could not search doctors right now. Please try again.'
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Specialties are a tiny, rarely changing public table — cache in the server
// process so every search request doesn't re-fetch the whole list.
const SPECIALTY_CACHE_TTL_MS = 60_000
let specialtyCache: { rows: { id: string; name: string }[]; at: number } | null = null

async function getCachedSpecialties(
  supabase: ReturnType<typeof createClient>
): Promise<{ rows: { id: string; name: string }[]; failed: boolean }> {
  if (specialtyCache && Date.now() - specialtyCache.at < SPECIALTY_CACHE_TTL_MS) {
    return { rows: specialtyCache.rows, failed: false }
  }
  const { data, error } = await supabase.from('specialties').select('id, name')
  if (error) return { rows: [], failed: true }
  specialtyCache = { rows: data ?? [], at: Date.now() }
  return { rows: specialtyCache.rows, failed: false }
}

/**
 * Resolve a specialty query param to a specialties row id.
 * Accepts a UUID id, a slug (e.g. "general-physician"), or a name (e.g. "Cardiologist").
 * `failed` is true when the lookup itself could not run (e.g. database unreachable),
 * so callers can report an error instead of an empty result.
 */
async function resolveSpecialtyId(
  supabase: ReturnType<typeof createClient>,
  specialty: string
): Promise<{ id: string | null; failed: boolean }> {
  if (UUID_RE.test(specialty)) {
    const { data, error } = await supabase
      .from('specialties')
      .select('id')
      .eq('id', specialty)
      .maybeSingle()
    if (error) return { id: null, failed: true }
    if (data) return { id: data.id, failed: false }
  }

  const { rows, failed } = await getCachedSpecialties(supabase)
  if (failed) return { id: null, failed: true }

  const target = slugify(specialty)
  const match = rows.find((s) => slugify(s.name) === target)
  return { id: match?.id ?? null, failed: false }
}

function searchResponse(payload: Record<string, unknown>, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: status === 200 ? { 'Cache-Control': SEARCH_CACHE_HEADER } : undefined,
  })
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const searchParams = request.nextUrl.searchParams

    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')
    const hasLocation = Boolean(lat && lng)
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '20')
    const q = sanitizeQuery(searchParams.get('q') || '')

    const specialty = searchParams.get('specialty')
    const distance = searchParams.get('distance_km') || searchParams.get('distance')
    const minRating = searchParams.get('min_rating')
    const minExperience = searchParams.get('min_experience')
    const availableToday = searchParams.get('available_today') === 'true'
    const availableNow = searchParams.get('available_now') === 'true'
    const hospitalId = searchParams.get('hospital_id')
    const gender = searchParams.get('gender')
    const language = searchParams.get('language')
    const maxFee = searchParams.get('max_fee')
    const sortBy = searchParams.get('sort_by') || 'best_match'

    let query = supabase
      .from('doctors')
      .select(DOCTOR_SEARCH_COLUMNS)
      .eq('verification_status', 'verified')

    // Hospital filter: resolve through the doctor_hospitals join table
    if (hospitalId) {
      if (!UUID_RE.test(hospitalId)) {
        return searchResponse({
          doctors: [],
          total_count: 0,
          page,
          per_page: perPage,
          has_more: false,
          message: 'Unknown hospital',
        })
      }
      const { data: links, error: linksError } = await supabase
        .from('doctor_hospitals')
        .select('doctor_id')
        .eq('hospital_id', hospitalId)
      if (linksError) {
        console.error('Hospital doctor lookup error:', linksError)
        return NextResponse.json({ error: describeSearchError(linksError) }, { status: 500 })
      }
      const doctorIds = links?.map((l) => l.doctor_id) || []
      if (doctorIds.length === 0) {
        return searchResponse({
          doctors: [],
          total_count: 0,
          page,
          per_page: perPage,
          has_more: false,
        })
      }
      query = query.in('id', doctorIds)
    }

    // Specialty filter (UUID, slug, or name)
    if (specialty) {
      const { id: specialtyId, failed } = await resolveSpecialtyId(supabase, specialty)
      if (failed) {
        return NextResponse.json(
          { error: 'Could not load specialties right now. Please try again.' },
          { status: 500 }
        )
      }
      if (!specialtyId) {
        return searchResponse({
          doctors: [],
          total_count: 0,
          page,
          per_page: perPage,
          has_more: false,
          message: `No doctors found for specialty "${specialty}"`,
        })
      }
      query = query.eq('specialization_id', specialtyId)
    }

    // Add rating filter
    if (minRating) {
      query = query.gte('rating_average', parseFloat(minRating))
    }

    // Add experience filter
    if (minExperience) {
      query = query.gte('experience_years', parseInt(minExperience))
    }

    // Add gender filter
    if (gender) {
      query = query.eq('gender', gender)
    }

    // Add language filter
    if (language) {
      query = query.contains('languages', [language])
    }

    // Add fee filter
    if (maxFee) {
      query = query.lte('consultation_fee', parseInt(maxFee))
    }

    // Add text search (doctor name or listed qualifications)
    if (q) {
      const escaped = q.replace(/[%_]/g, ' ')
      query = query.or(`full_name.ilike.%${escaped}%,qualifications.cs.{${escaped}}`)
    }

    // Add sorting that only uses real columns (distance is applied in memory below)
    switch (sortBy) {
      case 'highest_rated':
        query = query.order('rating_average', { ascending: false })
        break
      case 'most_experienced':
        query = query.order('experience_years', { ascending: false })
        break
      case 'lowest_fee':
        query = query.order('consultation_fee', { ascending: true })
        break
      case 'nearest':
      case 'available_today':
      case 'best_match':
      default:
        query = query
          .order('rating_average', { ascending: false })
          .order('verified_review_count', { ascending: false })
          .order('experience_years', { ascending: false })
        break
    }

    // Apply pagination
    const from = (page - 1) * perPage
    const to = from + perPage - 1
    query = query.range(from, to)

    // PostgREST types the embedded `hospital` relation inconsistently here,
    // and the in-memory distance fields below are added dynamically.
    const { data: doctors, error, count } = (await query) as unknown as {
      data: any[] | null
      error: { message: string } | null
      count: number | null
    }

    if (error) {
      console.error('Doctor search error:', error)
      return NextResponse.json({ error: describeSearchError(error) }, { status: 500 })
    }

    // Fetch hospitals for the doctors on this page (single query, not N+1)
    const doctorIds = doctors?.map((d) => d.id) || []
    let doctorHospitals: Array<{ doctor_id: string; hospital: any }> = []
    if (doctorIds.length > 0) {
      const { data } = await supabase
        .from('doctor_hospitals')
        .select('doctor_id, hospital:hospitals(id, name, address, latitude, longitude, phone)')
        .in('doctor_id', doctorIds)
      doctorHospitals = (data ?? []) as Array<{ doctor_id: string; hospital: any }>
    }

    // Attach hospitals to doctors
    const doctorsWithHospitals =
      doctors?.map((doctor) => ({
        ...doctor,
        hospitals:
          doctorHospitals
            ?.filter((dh) => dh.doctor_id === doctor.id)
            .map((dh) => dh.hospital) || [],
      })) || []

    // Calculate distances when the patient's location is known
    const doctorsWithDistance = doctorsWithHospitals.map((doctor) => {
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
        const dist = R * c
        return { ...doctor, distance_km: Math.round(dist * 10) / 10 }
      }
      return doctor
    })

    // Apply distance filter after computation
    let filteredDoctors = doctorsWithDistance
    if (distance && hasLocation) {
      const maxDistance = parseFloat(distance)
      filteredDoctors = filteredDoctors.filter(
        (d) => d.distance_km !== undefined && d.distance_km <= maxDistance
      )
    }

    // Nearest-first ordering (computed distance, so it happens in memory)
    if (sortBy === 'nearest' && hasLocation) {
      filteredDoctors = [...filteredDoctors].sort(
        (a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity)
      )
    }

    const today = new Date().getDay()
    const currentTime = new Date().toTimeString().slice(0, 5)

    if (availableToday || availableNow) {
      filteredDoctors = filteredDoctors.filter((doctor) => {
        const hasAvailability = doctor.availability?.some(
          (a: { day_of_week: number; is_active: boolean }) =>
            a.day_of_week === today && a.is_active
        )
        if (!hasAvailability) return false

        if (availableNow) {
          return doctor.availability?.some(
            (a: { day_of_week: number; is_active: boolean; start_time: string; end_time: string }) =>
              a.day_of_week === today &&
              a.is_active &&
              a.start_time <= currentTime &&
              a.end_time >= currentTime
          )
        }
        return true
      })
    }

    return searchResponse({
      doctors: filteredDoctors,
      total_count: filteredDoctors.length === perPage && count ? count : filteredDoctors.length,
      page,
      per_page: perPage,
      has_more: filteredDoctors.length === perPage,
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
