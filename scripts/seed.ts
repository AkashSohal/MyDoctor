import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function seed() {
  console.log('🌱 Starting MyDoctor seed...')

  // Create demo users
  const demoUsers = [
    { email: 'patient@demo.com', password: 'demo123', full_name: 'Demo Patient', role: 'patient' },
    { email: 'doctor@demo.com', password: 'demo123', full_name: 'Dr. Demo Doctor', role: 'doctor' },
    { email: 'admin@demo.com', password: 'demo123', full_name: 'Admin User', role: 'admin' },
  ]

  const createdUserIds: Record<string, string> = {}

  for (const user of demoUsers) {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.full_name, role: user.role },
    })

    if (authError && authError.code !== 'email_exists') {
      console.error(`Error creating user ${user.email}:`, authError)
    } else if (authData.user) {
      console.log(`✅ Created user: ${user.email} (${user.role})`)
      createdUserIds[user.email] = authData.user.id
    } else {
      console.log(`ℹ️ User already exists: ${user.email} (credentials will be synced below)`)
    }
  }

  // Fetch all users (including any already existing) to get IDs
  const { data: { users: allUsers } } = await supabase.auth.admin.listUsers()
  const getUserEmail = (email: string) => createdUserIds[email] || allUsers.find(u => u.email === email)?.id

  // Create demo doctor profile
  const doctorUserId = getUserEmail('doctor@demo.com')
  
  if (doctorUserId) {
    const { error: doctorError } = await supabase
      .from('doctors')
      .upsert({
        user_id: doctorUserId,
        full_name: 'Dr. Rahul Sharma',
        photo_url: null,
        qualifications: ['MBBS', 'MD (General Medicine)'],
        specialization_id: '00000000-0000-0000-0000-000000000001',
        experience_years: 12,
        gender: 'male',
        languages: ['English', 'Hindi', 'Punjabi'],
        bio: 'Experienced general physician with expertise in preventive care and chronic disease management. Committed to providing compassionate, evidence-based care.',
        consultation_fee: 500,
        latitude: 12.9716,
        longitude: 77.5946,
        address: '123 MG Road, Bangalore',
        medical_registration_number: 'KMC/12345',
        registration_council: 'Karnataka Medical Council',
        verification_status: 'verified',
        rating_average: 4.8,
        rating_count: 126,
        verified_review_count: 118,
        profile_completion_percentage: 95,
      }, { onConflict: 'user_id' })

    if (doctorError) {
      console.error('Error creating doctor profile:', doctorError)
    } else {
      console.log('✅ Created doctor profile')
    }
  }

  // Create more demo doctors
  const moreDoctors = [
    {
      email: 'cardiologist@demo.com',
      full_name: 'Dr. Priya Patel',
      specialization: '00000000-0000-0000-0000-000000000002',
      experience: 15,
      fee: 800,
      lat: 12.9352,
      lng: 77.6245,
      address: 'Apollo Hospital, Bannerghatta Road',
      reg: 'KMC/23456',
    },
    {
      email: 'dermatologist@demo.com',
      full_name: 'Dr. Amit Singh',
      specialization: '00000000-0000-0000-0000-000000000003',
      experience: 10,
      fee: 700,
      lat: 12.9592,
      lng: 77.6372,
      address: 'Manipal Hospital, Old Airport Road',
      reg: 'KMC/34567',
    },
    {
      email: 'pediatrician@demo.com',
      full_name: 'Dr. Sunita Reddy',
      specialization: '00000000-0000-0000-0000-000000000005',
      experience: 18,
      fee: 600,
      lat: 13.0067,
      lng: 77.5594,
      address: 'Columbia Asia Hospital, Malleswaram',
      reg: 'KMC/45678',
    },
    {
      email: 'orthopedic@demo.com',
      full_name: 'Dr. Vikram Kumar',
      specialization: '00000000-0000-0000-0000-000000000004',
      experience: 20,
      fee: 900,
      lat: 12.8132,
      lng: 77.6598,
      address: 'Narayana Health, Hosur Road',
      reg: 'KMC/56789',
    },
  ]

  // Specialization ids must never leak into user-facing text — resolve the
  // real specialty name from the specialties table before writing bios.
  const { data: specialtyRows } = await supabase.from('specialties').select('id, name')
  const specialtyNameById = new Map((specialtyRows ?? []).map((s) => [s.id, s.name]))

  for (const doc of moreDoctors) {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: doc.email,
      password: 'demo123',
      email_confirm: true,
      user_metadata: { full_name: doc.full_name, role: 'doctor' },
    })

    if (authError && authError.code !== 'email_exists') {
      console.error(`Error creating doctor ${doc.email}:`, authError)
      continue
    }
    if (authData.user) {
      createdUserIds[doc.email] = authData.user.id
    }
    const doctorUserId = createdUserIds[doc.email]
    if (doctorUserId) {
      await supabase
        .from('doctors')
        .upsert({
          user_id: doctorUserId,
          full_name: doc.full_name,
          qualifications: ['MBBS', 'MD'],
          specialization_id: doc.specialization,
          experience_years: doc.experience,
          gender: 'male',
          languages: ['English', 'Hindi'],
          bio: `Experienced ${specialtyNameById.get(doc.specialization) || 'Medical Specialist'} with ${doc.experience} years of experience.`,
          consultation_fee: doc.fee,
          latitude: doc.lat,
          longitude: doc.lng,
          address: doc.address,
          medical_registration_number: doc.reg,
          registration_council: 'Karnataka Medical Council',
          verification_status: 'verified',
          rating_average: 4.5 + Math.random() * 0.5,
          rating_count: Math.floor(Math.random() * 100) + 20,
          verified_review_count: Math.floor(Math.random() * 80) + 15,
          profile_completion_percentage: 90,
        }, { onConflict: 'user_id' })
      console.log(`✅ Created doctor: ${doc.full_name}`)
    }
  }

  // ---------------------------------------------------------------------------
  // Demo account credentials + role promotion
  // Idempotent. Uses verified auth UIDs only (never blind email updates).
  // Upgrade-only: an existing role is never downgraded, so a real admin can
  // never be demoted by re-running the seed.
  // ---------------------------------------------------------------------------
  const { data: { users: freshUsers } } = await supabase.auth.admin.listUsers()
  const findUserId = (email: string) =>
    createdUserIds[email] || freshUsers.find((u) => u.email === email)?.id

  const roleRank: Record<string, number> = { patient: 0, doctor: 1, admin: 2 }

  const demoAccounts: { email: string; password: string; fullName: string; role: 'patient' | 'doctor' | 'admin' }[] = [
    ...demoUsers.map((u) => ({ email: u.email, password: u.password, fullName: u.full_name, role: u.role as 'patient' | 'doctor' | 'admin' })),
    ...moreDoctors.map((d) => ({ email: d.email, password: 'demo123', fullName: d.full_name, role: 'doctor' as const })),
  ]

  for (const acct of demoAccounts) {
    const uid = findUserId(acct.email)
    if (!uid) {
      console.warn(`⚠️ Could not locate auth user for ${acct.email}; skipping`)
      continue
    }

    // Pre-existing demo accounts: sync password to the documented demo
    // credentials and make sure the email is confirmed (dev-only script).
    if (!createdUserIds[acct.email]) {
      const { error: credErr } = await supabase.auth.admin.updateUserById(uid, {
        password: acct.password,
        email_confirm: true,
      })
      if (credErr) {
        console.error(`Could not sync credentials for ${acct.email}:`, credErr)
      } else {
        console.log(`🔑 Synced credentials for existing account: ${acct.email}`)
      }
    }

    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', uid)
      .maybeSingle()

    if (profErr) {
      console.error(`Could not read profile for ${acct.email}:`, profErr)
      continue
    }

    if (!profile) {
      const { error: insErr } = await supabase.from('profiles').insert({
        id: uid,
        full_name: acct.fullName,
        email: acct.email,
        role: acct.role,
      })
      if (insErr) {
        console.error(`Could not create profile for ${acct.email}:`, insErr)
      } else {
        console.log(`✅ Created missing profile: ${acct.email} (${acct.role})`)
      }
      continue
    }

    const needsPromotion =
      profile.role !== acct.role &&
      (roleRank[acct.role] ?? 0) > (roleRank[profile.role] ?? 0)

    if (needsPromotion) {
      const { error: promErr } = await supabase
        .from('profiles')
        .update({ role: acct.role, email: acct.email })
        .eq('id', uid)

      if (promErr) {
        console.error(`Could not promote ${acct.email}:`, promErr)
      } else {
        console.log(`⬆️ Promoted ${acct.email}: ${profile.role} → ${acct.role} (uid ${uid})`)
      }
    } else if (!profile.email) {
      // Older handle_new_profile triggers never copied email onto profiles;
      // backfill it so admin tables show the address (role stays untouched).
      const { error: emailErr } = await supabase
        .from('profiles')
        .update({ email: acct.email })
        .eq('id', uid)
      if (emailErr) {
        console.error(`Could not backfill email for ${acct.email}:`, emailErr)
      } else {
        console.log(`✉️ Backfilled profile email: ${acct.email}`)
      }
    }
  }

  // Create demo hospitals
  const demoHospitals = [
    { name: 'City General Hospital', address: '45 MG Road, Bangalore', latitude: 12.9716, longitude: 77.5946, phone: '+91-80-12345678', email: 'info@citygeneral.in' },
    { name: 'Apollo Hospital', address: 'Bannerghatta Road, Bangalore', latitude: 12.9352, longitude: 77.6245, phone: '+91-80-23456789', email: 'info@apollo.in' },
    { name: 'Manipal Hospital', address: 'Old Airport Road, Bangalore', latitude: 12.9592, longitude: 77.6372, phone: '+91-80-34567890', email: 'info@manipal.in' },
    { name: 'Narayana Health', address: 'Hosur Road, Bangalore', latitude: 12.8132, longitude: 77.6598, phone: '+91-80-45678901', email: 'info@narayana.in' },
    { name: 'Columbia Asia Hospital', address: 'Malleswaram, Bangalore', latitude: 13.0067, longitude: 77.5594, phone: '+91-80-56789012', email: 'info@columbia.in' },
  ]

  for (const hospital of demoHospitals) {
    await supabase.from('hospitals').upsert(hospital, { onConflict: 'name' })
  }
  console.log('✅ Created demo hospitals')

  // Create doctor-hospital relationships
  const { data: allDoctors } = await supabase.from('doctors').select('id')
  const { data: allHospitals } = await supabase.from('hospitals').select('id')

  if (allDoctors && allHospitals) {
    for (const doctor of allDoctors) {
      const numHospitals = Math.floor(Math.random() * 3) + 1
      const shuffled = [...allHospitals].sort(() => 0.5 - Math.random())
      const selected = shuffled.slice(0, numHospitals)

      for (const hospital of selected) {
        await supabase
          .from('doctor_hospitals')
          .upsert({ doctor_id: doctor.id, hospital_id: hospital.id }, { onConflict: 'doctor_id,hospital_id' })
      }
    }
    console.log('✅ Created doctor-hospital relationships')
  }

  // Create availability for doctors
  const days = [0, 1, 2, 3, 4, 5, 6]
  const timeSlots = [
    { start: '09:00', end: '13:00' },
    { start: '14:00', end: '18:00' },
    { start: '16:00', end: '20:00' },
  ]

  for (const doctor of allDoctors || []) {
    const { data: docHospitals } = await supabase
      .from('doctor_hospitals')
      .select('hospital_id')
      .eq('doctor_id', doctor.id)

    if (docHospitals) {
      for (const dh of docHospitals) {
        // Add 2-4 days of availability
        const availableDays = [...days].sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 2)
        
        for (const day of availableDays) {
          const slot = timeSlots[Math.floor(Math.random() * timeSlots.length)]
          await supabase
            .from('availability')
            .upsert({
              doctor_id: doctor.id,
              hospital_id: dh.hospital_id,
              day_of_week: day,
              start_time: slot.start,
              end_time: slot.end,
              is_active: true,
            }, { onConflict: 'doctor_id,hospital_id,day_of_week,start_time' })
        }
      }
    }
  }
  console.log('✅ Created doctor availability')

  // Create demo reviews
  const patientUserId = getUserEmail('patient@demo.com')
  const { data: verifiedDoctors } = await supabase
    .from('doctors')
    .select('id')
    .eq('verification_status', 'verified')
    .limit(5)

  // Guard: never duplicate demo appointments/reviews on re-runs
  const { count: existingPatientReviews } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('patient_id', patientUserId ?? '')

  if (patientUserId && verifiedDoctors && !existingPatientReviews) {
    for (const doc of verifiedDoctors) {
      const { data: appointment } = await supabase
        .from('appointments')
        .insert({
          doctor_id: doc.id,
          hospital_id: (await supabase.from('doctor_hospitals').select('hospital_id').eq('doctor_id', doc.id).single()).data?.hospital_id || allHospitals?.[0]?.id,
          patient_id: patientUserId,
          appointment_date: new Date(Date.now() - 86400000 * Math.floor(Math.random() * 30)).toISOString().split('T')[0],
          appointment_time: '10:00',
          status: 'completed',
        })
        .select()
        .single()

      if (appointment) {
        await supabase
          .from('reviews')
          .insert({
            doctor_id: doc.id,
            patient_id: patientUserId,
            appointment_id: appointment.id,
            rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
            communication_rating: Math.floor(Math.random() * 2) + 4,
            professionalism_rating: Math.floor(Math.random() * 2) + 4,
            waiting_time_rating: Math.floor(Math.random() * 2) + 3,
            overall_experience_rating: Math.floor(Math.random() * 2) + 4,
            review_text: 'Excellent doctor, very thorough and caring. Highly recommended!',
            is_verified: true,
            status: 'published',
          })
      }
    }
    console.log('✅ Created demo reviews')
  } else if (existingPatientReviews) {
    console.log(`⏭️ Reviews already seeded (${existingPatientReviews} found) — skipping`)
  }

  console.log('🎉 Seeding complete!')
  console.log('\nDemo accounts:')
  console.log('  Patient: patient@demo.com / demo123')
  console.log('  Doctor: doctor@demo.com / demo123')
  console.log('  Admin: admin@demo.com / demo123')
}

seed().catch(console.error)