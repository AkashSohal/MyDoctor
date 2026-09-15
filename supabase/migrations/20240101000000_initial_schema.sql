-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('patient', 'doctor', 'admin')) DEFAULT 'patient',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Specialties table
CREATE TABLE public.specialties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hospitals table
CREATE TABLE public.hospitals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location GEOGRAPHY(POINT, 4326),
  phone TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctors table
CREATE TABLE public.doctors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  photo_url TEXT,
  qualifications TEXT[] DEFAULT '{}',
  specialization_id UUID REFERENCES public.specialties(id),
  experience_years INTEGER DEFAULT 0 CHECK (experience_years >= 0),
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  languages TEXT[] DEFAULT '{}',
  bio TEXT,
  consultation_fee INTEGER DEFAULT 0 CHECK (consultation_fee >= 0),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location GEOGRAPHY(POINT, 4326),
  address TEXT,
  medical_registration_number TEXT NOT NULL,
  registration_council TEXT NOT NULL,
  verification_status TEXT CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')) DEFAULT 'pending',
  rating_average NUMERIC(3,2) DEFAULT 0 CHECK (rating_average >= 0 AND rating_average <= 5),
  rating_count INTEGER DEFAULT 0 CHECK (rating_count >= 0),
  verified_review_count INTEGER DEFAULT 0 CHECK (verified_review_count >= 0),
  profile_completion_percentage INTEGER DEFAULT 0 CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctor-Hospital relationships
CREATE TABLE public.doctor_hospitals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, hospital_id)
);

-- Availability table
CREATE TABLE public.availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments table
CREATE TABLE public.appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'rejected')) DEFAULT 'pending',
  patient_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE UNIQUE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  waiting_time_rating INTEGER CHECK (waiting_time_rating >= 1 AND waiting_time_rating <= 5),
  overall_experience_rating INTEGER CHECK (overall_experience_rating >= 1 AND overall_experience_rating <= 5),
  review_text TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  status TEXT CHECK (status IN ('published', 'reported', 'hidden', 'pending_moderation')) DEFAULT 'pending_moderation',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table
CREATE TABLE public.reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'resolved', 'dismissed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved doctors table
CREATE TABLE public.saved_doctors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, doctor_id)
);

-- Indexes for performance
CREATE INDEX idx_doctors_specialization ON public.doctors(specialization_id);
CREATE INDEX idx_doctors_verification ON public.doctors(verification_status);
CREATE INDEX idx_doctors_location ON public.doctors USING GIST (location);
CREATE INDEX idx_doctors_rating ON public.doctors(rating_average DESC);
CREATE INDEX idx_doctors_experience ON public.doctors(experience_years DESC);
CREATE INDEX idx_doctors_fee ON public.doctors(consultation_fee);
CREATE INDEX idx_hospitals_location ON public.hospitals USING GIST (location);
CREATE INDEX idx_availability_doctor_day ON public.availability(doctor_id, day_of_week);
CREATE INDEX idx_appointments_doctor_date ON public.appointments(doctor_id, appointment_date);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_reviews_doctor ON public.reviews(doctor_id);
CREATE INDEX idx_reviews_patient ON public.reviews(patient_id);
CREATE INDEX idx_reviews_status ON public.reviews(status);
CREATE INDEX idx_saved_doctors_patient ON public.saved_doctors(patient_id);