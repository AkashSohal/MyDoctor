import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const searchParams = request.nextUrl.searchParams

    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '20')
    const q = searchParams.get('q') || ''

    const specialty = searchParams.get('specialty')
    const distance = searchParams.get('distance')
    const minRating = searchParams.get('min_rating')
    const minExperience = searchParams.get('min_experience')
    const availableToday = searchParams.get('available_today') === 'true'
    const availableNow = searchParams.get('available_now') === 'true'
    const hospitalId = searchParams.get('hospital_id')
    const gender = searchParams.get('gender')
    const language = searchParams.get('language')
    const maxFee = searchParams.get('max_fee')
    const sortBy = searchParams.get('sort_by') || 'best_match'

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Location required' }, { status: 400 })
    }

    let query = supabase
      .from('doctors')
      .select(`
        *,
        specialization:specialties(name),
        availability(*)
      `)
      .eq('verification_status', 'verified')

    // Add specialty filter
    if (specialty) {
      query = query.eq('specialization_id', specialty)
    }

    // Add rating filter
    if (minRating) {
      query = query.gte('rating_average', parseFloat(minRating))
    }

    // Add experience filter
    if (minExperience) {
      query = query.gte('experience_years', parseInt(minExperience))
    }

    // Add hospital filter
    if (hospitalId) {
      query = query.contains('hospitals', [{ id: hospitalId }])
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

    // Add text search
    if (q) {
      query = query.or(`full_name.ilike.%${q}%,qualifications.cs.{${q}}`)
    }

    // Add sorting
    switch (sortBy) {
      case 'nearest':
        query = query.order('distance_km', { ascending: true })
        break
      case 'highest_rated':
        query = query.order('rating_average', { ascending: false })
        break
      case 'most_experienced':
        query = query.order('experience_years', { ascending: false })
        break
      case 'available_today':
        // This would need a join with availability
        query = query.order('rating_average', { ascending: false })
        break
      case 'lowest_fee':
        query = query.order('consultation_fee', { ascending: true })
        break
      case 'best_match':
      default:
        query = query
          .order('rating_average', { ascending: false })
          .order('verified_review_count', { ascending: false })
          .order('experience_years', { ascending: false })
          .order('distance_km', { ascending: true })
        break
    }

    // Apply pagination
    const from = (page - 1) * perPage
    const to = from + perPage - 1
    query = query.range(from, to)

    const { data: doctors, error, count } = await query

    if (error) {
      console.error('Doctor search error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch hospitals for each doctor
    const doctorIds = doctors?.map(d => d.id) || []
    const { data: doctorHospitals } = await supabase
      .from('doctor_hospitals')
      .select('doctor_id, hospital:hospitals(id, name, address, latitude, longitude, phone)')
      .in('doctor_id', doctorIds)

    // Attach hospitals to doctors
    const doctorsWithHospitals = doctors?.map(doctor => ({
      ...doctor,
      hospitals: doctorHospitals?.filter(dh => dh.doctor_id === doctor.id).map(dh => dh.hospital) || []
    })) || []

    // Calculate distances if not already present
    const doctorsWithDistance = doctorsWithHospitals.map(doctor => {
      if (doctor.latitude && doctor.longitude) {
        const R = 6371
        const dLat = ((doctor.latitude - lat) * Math.PI) / 180
        const dLng = ((doctor.longitude - lng) * Math.PI) / 180
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos((lat * Math.PI) / 180) * Math.cos((doctor.latitude * Math.PI) / 180) *
          Math.sin(dLng/2) * Math.sin(dLng/2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        const dist = R * c
        return { ...doctor, distance_km: Math.round(dist * 10) / 10 }
      }
      return doctor
    })

    // Apply distance filter after computation
    let filteredDoctors = doctorsWithDistance
    if (distance) {
      filteredDoctors = filteredDoctors.filter(d => d.distance_km && d.distance_km <= parseFloat(distance))
    }
    const today = new Date().getDay()
    const currentTime = new Date().toTimeString().slice(0, 5)

    if (availableToday || availableNow) {
      filteredDoctors = filteredDoctors.filter(doctor => {
        const hasAvailability = doctor.availability?.some((a: any) => 
          a.day_of_week === today && a.is_active
        )
        if (!hasAvailability) return false
        
        if (availableNow) {
          return doctor.availability?.some((a: any) => 
            a.day_of_week === today && a.is_active && 
            a.start_time <= currentTime && a.end_time >= currentTime
          )
        }
        return true
      })
    }

    return NextResponse.json({
      doctors: filteredDoctors,
      total_count: count || filteredDoctors.length,
      page,
      per_page: perPage,
      has_more: filteredDoctors.length === perPage,
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}