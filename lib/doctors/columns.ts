/**
 * Column set shared by the doctor directory endpoints.
 * Always joins the real specialization through doctors.specialization_id so
 * callers receive the specialties row (id + name) instead of a bare UUID.
 */
export const DOCTOR_SEARCH_COLUMNS = `
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
