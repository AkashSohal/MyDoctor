export interface User {
  id: string
  email: string
  phone?: string
  full_name?: string
  avatar_url?: string
  role: 'patient' | 'doctor' | 'admin'
  created_at: string
  updated_at: string
}

export interface Doctor {
  id: string
  user_id: string
  full_name: string
  photo_url?: string
  qualifications: string[]
  specialization_id: string
  experience_years: number
  gender?: 'male' | 'female' | 'other'
  languages: string[]
  bio?: string
  consultation_fee: number
  latitude?: number
  longitude?: number
  address?: string
  medical_registration_number: string
  registration_council: string
  verification_status: 'pending' | 'verified' | 'rejected' | 'suspended'
  rating_average: number
  rating_count: number
  verified_review_count: number
  profile_completion_percentage: number
  created_at: string
  updated_at: string
  specialization?: Specialty
  hospitals?: Hospital[]
  availability?: Availability[]
  match_score?: number
  distance_km?: number
}

export interface Specialty {
  id: string
  name: string
  description?: string
  icon?: string
  created_at: string
  doctor_count?: number
}

export interface Hospital {
  id: string
  name: string
  address: string
  latitude?: number
  longitude?: number
  phone?: string
  website?: string
  created_at: string
  distance_km?: number
  doctor_count?: number
}

export interface Availability {
  id: string
  doctor_id: string
  hospital_id: string
  day_of_week: number // 0 = Sunday, 6 = Saturday
  start_time: string // HH:MM format
  end_time: string // HH:MM format
  is_active: boolean
  hospital?: Hospital
}

export interface Appointment {
  id: string
  doctor_id: string
  hospital_id: string
  patient_id: string
  appointment_date: string // YYYY-MM-DD
  appointment_time: string // HH:MM
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected'
  patient_message?: string
  created_at: string
  updated_at: string
  doctor?: Doctor
  hospital?: Hospital
  patient?: User
}

export interface Review {
  id: string
  doctor_id: string
  patient_id: string
  appointment_id: string
  rating: number // 1-5
  communication_rating?: number
  professionalism_rating?: number
  waiting_time_rating?: number
  overall_experience_rating?: number
  review_text?: string
  is_verified: boolean
  status: 'published' | 'reported' | 'hidden' | 'pending_moderation'
  created_at: string
  patient?: User
}

export interface Report {
  id: string
  doctor_id?: string
  user_id: string
  review_id?: string
  reason: string
  status: 'pending' | 'resolved' | 'dismissed'
  created_at: string
}

export interface SavedDoctor {
  id: string
  patient_id: string
  doctor_id: string
  created_at: string
  doctor?: Doctor
}

export interface SearchFilters {
  specialty?: string
  distance_km?: number
  available_today?: boolean
  available_now?: boolean
  hospital_id?: string
  min_rating?: number
  min_experience?: number
  gender?: string
  language?: string
  max_fee?: number
  sort_by?: 'best_match' | 'nearest' | 'highest_rated' | 'most_experienced' | 'available_today' | 'lowest_fee'
}

export interface SearchResult {
  doctors: Doctor[]
  total_count: number
  page: number
  per_page: number
  has_more: boolean
}

export interface MatchScoreBreakdown {
  specialty_match: number
  rating_score: number
  verification_score: number
  experience_score: number
  availability_score: number
  distance_score: number
  total: number
}

export interface Location {
  latitude: number
  longitude: number
  address?: string
  city?: string
  state?: string
  pincode?: string
}

export interface PaginationParams {
  page: number
  per_page: number
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}