-- Database Functions and Triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply updated_at trigger to tables
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER doctors_updated_at
  BEFORE UPDATE ON public.doctors
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER availability_updated_at
  BEFORE UPDATE ON public.availability
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to update doctor location from lat/lng
CREATE OR REPLACE FUNCTION public.update_doctor_location()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  ELSE
    NEW.location = NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER doctor_location_update
  BEFORE INSERT OR UPDATE ON public.doctors
  FOR EACH ROW EXECUTE FUNCTION public.update_doctor_location();

-- Function to update hospital location from lat/lng
CREATE OR REPLACE FUNCTION public.update_hospital_location()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  ELSE
    NEW.location = NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER hospital_location_update
  BEFORE INSERT OR UPDATE ON public.hospitals
  FOR EACH ROW EXECUTE FUNCTION public.update_hospital_location();

-- Function to calculate distance between two points (in kilometers)
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 DOUBLE PRECISION,
  lng1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lng2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  RETURN ST_Distance(
    ST_SetSRID(ST_MakePoint(lng1, lat1), 4326)::geography,
    ST_SetSRID(ST_MakePoint(lng2, lat2), 4326)::geography
  ) / 1000.0;
END;
$$;

-- Function to get nearby doctors using PostGIS
CREATE OR REPLACE FUNCTION public.get_nearby_doctors(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 25,
  specialty_id UUID DEFAULT NULL,
  min_rating NUMERIC DEFAULT NULL,
  min_experience INTEGER DEFAULT NULL,
  available_today BOOLEAN DEFAULT FALSE,
  available_now BOOLEAN DEFAULT FALSE,
  hospital_id UUID DEFAULT NULL,
  gender_filter TEXT DEFAULT NULL,
  language_filter TEXT DEFAULT NULL,
  max_fee INTEGER DEFAULT NULL,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  full_name TEXT,
  photo_url TEXT,
  qualifications TEXT[],
  specialization_id UUID,
  experience_years INTEGER,
  gender TEXT,
  languages TEXT[],
  bio TEXT,
  consultation_fee INTEGER,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address TEXT,
  medical_registration_number TEXT,
  registration_council TEXT,
  verification_status TEXT,
  rating_average NUMERIC,
  rating_count INTEGER,
  verified_review_count INTEGER,
  profile_completion_percentage INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  distance_km DOUBLE PRECISION,
  specialization_name TEXT,
  hospital_names TEXT[],
  available_today_flag BOOLEAN,
  available_now_flag BOOLEAN
) LANGUAGE plpgsql AS $$
DECLARE
  user_location GEOGRAPHY := ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography;
  today_int INTEGER := EXTRACT(DOW FROM NOW())::INTEGER;
  current_time TIME := NOW()::TIME;
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.user_id,
    d.full_name,
    d.photo_url,
    d.qualifications,
    d.specialization_id,
    d.experience_years,
    d.gender,
    d.languages,
    d.bio,
    d.consultation_fee,
    d.latitude,
    d.longitude,
    d.address,
    d.medical_registration_number,
    d.registration_council,
    d.verification_status,
    d.rating_average,
    d.rating_count,
    d.verified_review_count,
    d.profile_completion_percentage,
    d.created_at,
    d.updated_at,
    ST_Distance(d.location, user_location) / 1000.0 AS distance_km,
    s.name AS specialization_name,
    (
      SELECT ARRAY_AGG(h.name)
      FROM public.hospitals h
      JOIN public.doctor_hospitals dh ON dh.hospital_id = h.id
      WHERE dh.doctor_id = d.id
    ) AS hospital_names,
    (
      SELECT COUNT(*) > 0
      FROM public.availability a
      WHERE a.doctor_id = d.id
      AND a.day_of_week = today_int
      AND a.is_active = TRUE
      AND a.start_time <= current_time
      AND a.end_time >= current_time
    ) AS available_now_flag,
    (
      SELECT COUNT(*) > 0
      FROM public.availability a
      WHERE a.doctor_id = d.id
      AND a.day_of_week = today_int
      AND a.is_active = TRUE
    ) AS available_today_flag
  FROM public.doctors d
  LEFT JOIN public.specialties s ON s.id = d.specialization_id
  WHERE d.verification_status = 'verified'
  AND d.location IS NOT NULL
  AND ST_DWithin(d.location, user_location, radius_km * 1000)
  AND (specialty_id IS NULL OR d.specialization_id = specialty_id)
  AND (min_rating IS NULL OR d.rating_average >= min_rating)
  AND (min_experience IS NULL OR d.experience_years >= min_experience)
  AND (hospital_id IS NULL OR EXISTS (
    SELECT 1 FROM public.doctor_hospitals dh WHERE dh.doctor_id = d.id AND dh.hospital_id = hospital_id
  ))
  AND (gender_filter IS NULL OR d.gender = gender_filter)
  AND (language_filter IS NULL OR d.languages @> ARRAY[language_filter])
  AND (max_fee IS NULL OR d.consultation_fee <= max_fee)
  AND (NOT available_today OR EXISTS (
    SELECT 1 FROM public.availability a
    WHERE a.doctor_id = d.id
    AND a.day_of_week = today_int
    AND a.is_active = TRUE
  ))
  AND (NOT available_now OR EXISTS (
    SELECT 1 FROM public.availability a
    WHERE a.doctor_id = d.id
    AND a.day_of_week = today_int
    AND a.is_active = TRUE
    AND a.start_time <= current_time
    AND a.end_time >= current_time
  ))
  ORDER BY
    CASE WHEN available_now THEN
      CASE
        WHEN EXISTS (
          SELECT 1 FROM public.availability a
          WHERE a.doctor_id = d.id
          AND a.day_of_week = today_int
          AND a.is_active = TRUE
          AND a.start_time <= current_time
          AND a.end_time >= current_time
        ) THEN 0 ELSE 1
      END
    ELSE 1 END,
    d.rating_average DESC NULLS LAST,
    d.verified_review_count DESC NULLS LAST,
    d.experience_years DESC NULLS LAST,
    ST_Distance(d.location, user_location)
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Function to calculate match score
CREATE OR REPLACE FUNCTION public.calculate_match_score(
  doctor_id UUID,
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  search_specialty_id UUID DEFAULT NULL,
  weights JSONB DEFAULT '{"specialty_match": 0.3, "patient_rating": 0.2, "verified_profile": 0.15, "relevant_experience": 0.15, "availability": 0.1, "distance": 0.1}'::JSONB
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  doc RECORD;
  spec_match NUMERIC := 0;
  rating_score NUMERIC := 0;
  verification_score NUMERIC := 0;
  experience_score NUMERIC := 0;
  availability_score NUMERIC := 0;
  distance_score NUMERIC := 0;
  total_score NUMERIC := 0;
  distance_km NUMERIC;
  today_int INTEGER := EXTRACT(DOW FROM NOW())::INTEGER;
  current_time TIME := NOW()::TIME;
  w_specialty NUMERIC := (weights->>'specialty_match')::NUMERIC;
  w_rating NUMERIC := (weights->>'patient_rating')::NUMERIC;
  w_verified NUMERIC := (weights->>'verified_profile')::NUMERIC;
  w_experience NUMERIC := (weights->>'relevant_experience')::NUMERIC;
  w_availability NUMERIC := (weights->>'availability')::NUMERIC;
  w_distance NUMERIC := (weights->>'distance')::NUMERIC;
BEGIN
  SELECT * INTO doc FROM public.doctors WHERE id = doctor_id;
  
  IF NOT FOUND THEN
    RETURN '{"error": "Doctor not found"}'::JSONB;
  END IF;

  -- Specialty match (30%)
  IF search_specialty_id IS NOT NULL AND doc.specialization_id = search_specialty_id THEN
    spec_match := 1.0;
  ELSIF search_specialty_id IS NULL THEN
    spec_match := 0.5;
  ELSE
    spec_match := 0.0;
  END IF;

  -- Patient rating (20%) - adjusted for review count
  IF doc.rating_count >= 100 THEN
    rating_score := doc.rating_average / 5.0;
  ELSIF doc.rating_count >= 10 THEN
    rating_score := (doc.rating_average / 5.0) * 0.8;
  ELSIF doc.rating_count > 0 THEN
    rating_score := (doc.rating_average / 5.0) * 0.5;
  ELSE
    rating_score := 0.3;
  END IF;

  -- Verified profile (15%)
  verification_score := CASE WHEN doc.verification_status = 'verified' THEN 1.0 ELSE 0.0 END;

  -- Relevant experience (15%) - capped at 20 years
  experience_score := LEAST(doc.experience_years::NUMERIC / 20.0, 1.0);

  -- Availability (10%)
  IF EXISTS (
    SELECT 1 FROM public.availability a
    WHERE a.doctor_id = doc.id
    AND a.day_of_week = today_int
    AND a.is_active = TRUE
    AND a.start_time <= current_time
    AND a.end_time >= current_time
  ) THEN
    availability_score := 1.0;
  ELSIF EXISTS (
    SELECT 1 FROM public.availability a
    WHERE a.doctor_id = doc.id
    AND a.day_of_week = today_int
    AND a.is_active = TRUE
  ) THEN
    availability_score := 0.7;
  ELSE
    availability_score := 0.0;
  END IF;

  -- Distance (10%) - inverse distance, capped at 25km
  IF doc.location IS NOT NULL THEN
    distance_km := ST_Distance(doc.location, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography) / 1000.0;
    distance_score := GREATEST(1.0 - (distance_km / 25.0), 0.0);
  ELSE
    distance_score := 0.0;
  END IF;

  total_score := (
    spec_match * w_specialty +
    rating_score * w_rating +
    verification_score * w_verified +
    experience_score * w_experience +
    availability_score * w_availability +
    distance_score * w_distance
  ) * 100;

  RETURN jsonb_build_object(
    'total_score', ROUND(total_score)::INTEGER,
    'breakdown', jsonb_build_object(
      'specialty_match', ROUND(spec_match * 100)::INTEGER,
      'patient_rating', ROUND(rating_score * 100)::INTEGER,
      'verified_profile', ROUND(verification_score * 100)::INTEGER,
      'relevant_experience', ROUND(experience_score * 100)::INTEGER,
      'availability', ROUND(availability_score * 100)::INTEGER,
      'distance', ROUND(distance_score * 100)::INTEGER
    ),
    'distance_km', ROUND(distance_km, 1)
  );
END;
$$;

-- Function to update doctor rating from reviews
CREATE OR REPLACE FUNCTION public.update_doctor_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  avg_rating NUMERIC;
  review_count INTEGER;
  verified_count INTEGER;
BEGIN
  SELECT
    COALESCE(AVG(rating)::NUMERIC(3,2), 0),
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE is_verified = TRUE)::INTEGER
  INTO avg_rating, review_count, verified_count
  FROM public.reviews
  WHERE doctor_id = COALESCE(NEW.doctor_id, OLD.doctor_id)
  AND status = 'published';

  UPDATE public.doctors
  SET
    rating_average = avg_rating,
    rating_count = review_count,
    verified_review_count = verified_count
  WHERE id = COALESCE(NEW.doctor_id, OLD.doctor_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_doctor_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_doctor_rating();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();