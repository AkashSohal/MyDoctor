-- =============================================================================
-- MyDoctor — Full schema (profiles-based), RLS, triggers, seeds, demo data
-- =============================================================================
-- HOW TO APPLY (manual, exactly once):
--   Supabase Dashboard -> SQL Editor -> New query -> paste this file -> Run.
--
-- SAFETY:
--   * Idempotent: every statement is guarded (IF NOT EXISTS / CREATE OR REPLACE /
--     policy existence checks) — re-running has no effect and destroys nothing.
--   * NEVER touches existing public.profiles rows; only adds optional columns
--     (email, avatar_url) and backfills email from auth.users where NULL.
--   * Compatible with the already-applied 20261018000000_profiles_security.sql:
--     its triggers are kept; handle_new_profile() / protect_profile_update()
--     are replaced with backward-compatible supersets (email copied at signup;
--     self role change patient -> doctor now allowed so doctor onboarding works).
--   * Does NOT create public.users (obsolete design). All FKs -> public.profiles.
--   * Does NOT disable RLS anywhere. Existing profiles policies are untouched
--     (profiles_select_own / profiles_update_own / profiles_insert_own remain).
--   * No service-role key is used or needed anywhere.
--
-- DEMO DATA (optional, clearly marked): 17 specialties, 5 hospitals, 3 verified
--   demo doctors (login: dr.asha@mydoctor.test, dr.vikram@mydoctor.test,
--   dr.neha@mydoctor.test / password: Demo1234!). Removal script at the bottom.
--
-- NOTE: the availability table is deliberately named `availability` (not
--   `doctor_availability`) because every application query uses that name.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Extensions (pgcrypto for crypt() in the demo block; both are install-safe)
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. profiles: additive columns + backfills + compatible function replacements
--    (no row is deleted or overwritten)
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'patient';

UPDATE public.profiles
SET updated_at = COALESCE(updated_at, created_at, NOW())
WHERE updated_at IS NULL;

-- Backfill email from auth.users only where it is missing (never overwrites)
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id AND p.email IS NULL AND u.email IS NOT NULL;

-- Sign-up trigger: same behaviour as profiles_security, plus email column
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    BEGIN
      INSERT INTO public.profiles (id, full_name, phone, role, email, created_at, updated_at)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
        NULLIF(NEW.raw_user_meta_data ->> 'phone', ''),
        'patient',
        NULLIF(NEW.email, ''),
        NOW(),
        NOW()
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not create profile for user %: %', NEW.id, SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$;
-- (trigger on_auth_user_created_profile from profiles_security stays as-is)

-- protect_profile_update: same guards as profiles_security (id/created_at
-- immutable, updated_at stamped), PLUS: a user may promote themselves
-- patient -> doctor (needed by doctor onboarding; directory visibility is
-- still gated by admin verification of the doctors row). Only admins may set
-- any other role. NULL auth.uid() (SQL Editor / service role) always passes.
CREATE OR REPLACE FUNCTION public.protect_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Profile id cannot be changed';
  END IF;

  NEW.created_at := OLD.created_at;
  NEW.updated_at := NOW();

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF auth.uid() IS NULL THEN
      RETURN NEW;
    END IF;
    IF OLD.role = 'patient' AND NEW.role = 'doctor' AND auth.uid() = NEW.id THEN
      RETURN NEW;
    END IF;
    SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
    IF caller_role IS DISTINCT FROM 'admin' THEN
      RAISE EXCEPTION 'You are not allowed to change your account role';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
-- (trigger profiles_protect_update from profiles_security stays as-is)

-- -----------------------------------------------------------------------------
-- 2. Reference tables
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  phone TEXT,
  website TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. Core tables — every FK points at public.profiles (never public.users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles (id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  photo_url TEXT,
  bio TEXT,
  qualifications TEXT[] NOT NULL DEFAULT '{}',
  specialization_id UUID REFERENCES public.specialties (id) ON DELETE SET NULL,
  experience_years INTEGER NOT NULL DEFAULT 0 CHECK (experience_years >= 0),
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  languages TEXT[] NOT NULL DEFAULT '{}',
  consultation_fee INTEGER NOT NULL DEFAULT 0 CHECK (consultation_fee >= 0),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address TEXT,
  medical_registration_number TEXT NOT NULL,
  registration_council TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
  rating_average NUMERIC(3,2) NOT NULL DEFAULT 0
    CHECK (rating_average >= 0 AND rating_average <= 5),
  rating_count INTEGER NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  verified_review_count INTEGER NOT NULL DEFAULT 0 CHECK (verified_review_count >= 0),
  profile_completion_percentage INTEGER NOT NULL DEFAULT 0
    CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.doctor_hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors (id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES public.hospitals (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT doctor_hospitals_doctor_hospital_key UNIQUE (doctor_id, hospital_id)
);

CREATE TABLE IF NOT EXISTS public.availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors (id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES public.hospitals (id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT availability_slot_key UNIQUE (doctor_id, hospital_id, day_of_week, start_time),
  CONSTRAINT availability_time_order CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors (id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES public.hospitals (id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'rejected')),
  patient_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors (id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL UNIQUE REFERENCES public.appointments (id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  waiting_time_rating INTEGER CHECK (waiting_time_rating >= 1 AND waiting_time_rating <= 5),
  overall_experience_rating INTEGER CHECK (overall_experience_rating >= 1 AND overall_experience_rating <= 5),
  review_text TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending_moderation'
    CHECK (status IN ('published', 'reported', 'hidden', 'pending_moderation')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES public.doctors (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  review_id UUID REFERENCES public.reviews (id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.saved_doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT saved_doctors_patient_doctor_key UNIQUE (patient_id, doctor_id)
);

-- -----------------------------------------------------------------------------
-- 4. Indexes (every filter/join/sort column used by the app)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_doctors_specialization     ON public.doctors (specialization_id);
CREATE INDEX IF NOT EXISTS idx_doctors_verification       ON public.doctors (verification_status);
CREATE INDEX IF NOT EXISTS idx_doctors_rating             ON public.doctors (rating_average DESC);
CREATE INDEX IF NOT EXISTS idx_doctors_experience         ON public.doctors (experience_years DESC);
CREATE INDEX IF NOT EXISTS idx_doctors_fee                ON public.doctors (consultation_fee);
CREATE INDEX IF NOT EXISTS idx_doctors_languages          ON public.doctors USING GIN (languages);
CREATE INDEX IF NOT EXISTS idx_doctors_qualifications     ON public.doctors USING GIN (qualifications);
CREATE INDEX IF NOT EXISTS idx_doctor_hospitals_hospital  ON public.doctor_hospitals (hospital_id);
CREATE INDEX IF NOT EXISTS idx_availability_doctor_day    ON public.availability (doctor_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date   ON public.appointments (doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient       ON public.appointments (patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status        ON public.appointments (status);
CREATE INDEX IF NOT EXISTS idx_reviews_doctor             ON public.reviews (doctor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_patient            ON public.reviews (patient_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status             ON public.reviews (status);
CREATE INDEX IF NOT EXISTS idx_saved_doctors_patient      ON public.saved_doctors (patient_id);

-- Data-integrity backstop for the booking flow (RLS must not be widened to
-- implement slot conflicts): no two live bookings for the same slot, and no
-- patient double-booking across doctors at the same date+time.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_appointment_slot
  ON public.appointments (doctor_id, hospital_id, appointment_date, appointment_time)
  WHERE status IN ('pending', 'confirmed');

CREATE UNIQUE INDEX IF NOT EXISTS uniq_patient_slot
  ON public.appointments (patient_id, appointment_date, appointment_time)
  WHERE status IN ('pending', 'confirmed');

-- -----------------------------------------------------------------------------
-- 5. Helper functions + triggers
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS doctors_updated_at ON public.doctors;
CREATE TRIGGER doctors_updated_at
  BEFORE UPDATE ON public.doctors
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS availability_updated_at ON public.availability;
CREATE TRIGGER availability_updated_at
  BEFORE UPDATE ON public.availability
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS appointments_updated_at ON public.appointments;
CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Admin helper used by RLS policies. SECURITY DEFINER so it reads profiles
-- without recursive RLS evaluation; body only inspects auth.uid()'s own role
-- and returns a boolean, so being executable by everyone is harmless.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT p.role = 'admin' FROM public.profiles p WHERE p.id = auth.uid()),
    FALSE
  );
$$;

-- Doctors cannot grant themselves verification, and only admins may change
-- verification status or re-assign a doctor row to another profile.
-- auth.uid() IS NULL = SQL Editor / service role, allowed by design.
CREATE OR REPLACE FUNCTION public.protect_doctor_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     AND auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can reassign a doctor profile';
  END IF;

  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
     AND auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can change verification status';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS doctors_protect_update ON public.doctors;
CREATE TRIGGER doctors_protect_update
  BEFORE UPDATE ON public.doctors
  FOR EACH ROW EXECUTE FUNCTION public.protect_doctor_update();

-- -----------------------------------------------------------------------------
-- 6. Row Level Security — enabled on every table (never disabled anywhere)
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_doctors ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 7. Policies (created only when missing — safe to re-run)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  -- profiles: profiles_security already created profiles_select_own /
  -- profiles_update_own / profiles_insert_own — preserved untouched.
  -- Add: authenticated users may read profile rows (names/phones/emails are
  -- needed in appointment & moderation embeds). anon stays fully blocked.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'profiles_select_authenticated'
  ) THEN
    CREATE POLICY profiles_select_authenticated ON public.profiles
      FOR SELECT TO authenticated
      USING (TRUE);
  END IF;
END $$;

DO $$
BEGIN
  -- specialties: public read, admin manage
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='specialties' AND policyname='specialties_select_public') THEN
    CREATE POLICY specialties_select_public ON public.specialties
      FOR SELECT TO anon, authenticated USING (TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='specialties' AND policyname='specialties_insert_admin') THEN
    CREATE POLICY specialties_insert_admin ON public.specialties
      FOR INSERT TO authenticated WITH CHECK (public.is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='specialties' AND policyname='specialties_update_admin') THEN
    CREATE POLICY specialties_update_admin ON public.specialties
      FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='specialties' AND policyname='specialties_delete_admin') THEN
    CREATE POLICY specialties_delete_admin ON public.specialties
      FOR DELETE TO authenticated USING (public.is_admin());
  END IF;

  -- hospitals: public read, admin manage
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='hospitals' AND policyname='hospitals_select_public') THEN
    CREATE POLICY hospitals_select_public ON public.hospitals
      FOR SELECT TO anon, authenticated USING (TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='hospitals' AND policyname='hospitals_insert_admin') THEN
    CREATE POLICY hospitals_insert_admin ON public.hospitals
      FOR INSERT TO authenticated WITH CHECK (public.is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='hospitals' AND policyname='hospitals_update_admin') THEN
    CREATE POLICY hospitals_update_admin ON public.hospitals
      FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='hospitals' AND policyname='hospitals_delete_admin') THEN
    CREATE POLICY hospitals_delete_admin ON public.hospitals
      FOR DELETE TO authenticated USING (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  -- doctors: only VERIFIED doctors are public; own row any status; admin all.
  -- Insert requires own row + status 'pending' (self-verification impossible
  -- at the policy level; the doctors_protect_update trigger is the 2nd layer).
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='doctors' AND policyname='doctors_select_public') THEN
    CREATE POLICY doctors_select_public ON public.doctors
      FOR SELECT TO anon, authenticated USING (verification_status = 'verified');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='doctors' AND policyname='doctors_select_own') THEN
    CREATE POLICY doctors_select_own ON public.doctors
      FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='doctors' AND policyname='doctors_select_admin') THEN
    CREATE POLICY doctors_select_admin ON public.doctors
      FOR SELECT TO authenticated USING (public.is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='doctors' AND policyname='doctors_insert_own') THEN
    CREATE POLICY doctors_insert_own ON public.doctors
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid() AND verification_status = 'pending');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='doctors' AND policyname='doctors_update_own') THEN
    CREATE POLICY doctors_update_own ON public.doctors
      FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='doctors' AND policyname='doctors_update_admin') THEN
    CREATE POLICY doctors_update_admin ON public.doctors
      FOR UPDATE TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
  -- no DELETE policy: doctor rows are never deleted by clients
END $$;

DO $$
BEGIN
  -- doctor_hospitals: public for verified doctors; owner-managed; admin all
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='doctor_hospitals' AND policyname='doctor_hospitals_select_public') THEN
    CREATE POLICY doctor_hospitals_select_public ON public.doctor_hospitals
      FOR SELECT TO anon, authenticated
      USING (EXISTS (
        SELECT 1 FROM public.doctors d
        WHERE d.id = doctor_id AND d.verification_status = 'verified'
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='doctor_hospitals' AND policyname='doctor_hospitals_select_own') THEN
    CREATE POLICY doctor_hospitals_select_own ON public.doctor_hospitals
      FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.doctors d
        WHERE d.id = doctor_id AND d.user_id = auth.uid()
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='doctor_hospitals' AND policyname='doctor_hospitals_select_admin') THEN
    CREATE POLICY doctor_hospitals_select_admin ON public.doctor_hospitals
      FOR SELECT TO authenticated USING (public.is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='doctor_hospitals' AND policyname='doctor_hospitals_manage_own') THEN
    CREATE POLICY doctor_hospitals_manage_own ON public.doctor_hospitals
      FOR ALL TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.doctors d
        WHERE d.id = doctor_id AND d.user_id = auth.uid()
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.doctors d
        WHERE d.id = doctor_id AND d.user_id = auth.uid()
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='doctor_hospitals' AND policyname='doctor_hospitals_manage_admin') THEN
    CREATE POLICY doctor_hospitals_manage_admin ON public.doctor_hospitals
      FOR ALL TO authenticated
      USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  -- availability: same pattern as doctor_hospitals
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='availability' AND policyname='availability_select_public') THEN
    CREATE POLICY availability_select_public ON public.availability
      FOR SELECT TO anon, authenticated
      USING (EXISTS (
        SELECT 1 FROM public.doctors d
        WHERE d.id = doctor_id AND d.verification_status = 'verified'
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='availability' AND policyname='availability_select_own') THEN
    CREATE POLICY availability_select_own ON public.availability
      FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.doctors d
        WHERE d.id = doctor_id AND d.user_id = auth.uid()
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='availability' AND policyname='availability_select_admin') THEN
    CREATE POLICY availability_select_admin ON public.availability
      FOR SELECT TO authenticated USING (public.is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='availability' AND policyname='availability_manage_own') THEN
    CREATE POLICY availability_manage_own ON public.availability
      FOR ALL TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.doctors d
        WHERE d.id = doctor_id AND d.user_id = auth.uid()
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.doctors d
        WHERE d.id = doctor_id AND d.user_id = auth.uid()
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='availability' AND policyname='availability_manage_admin') THEN
    CREATE POLICY availability_manage_admin ON public.availability
      FOR ALL TO authenticated
      USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  -- appointments: patients see/book/cancel their own; doctors manage theirs
  -- (confirm/reject/complete); admins see all. No DELETE policy.
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='appointments' AND policyname='appointments_select_patient') THEN
    CREATE POLICY appointments_select_patient ON public.appointments
      FOR SELECT TO authenticated USING (patient_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='appointments' AND policyname='appointments_select_doctor') THEN
    CREATE POLICY appointments_select_doctor ON public.appointments
      FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.doctors d
        WHERE d.id = doctor_id AND d.user_id = auth.uid()
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='appointments' AND policyname='appointments_select_admin') THEN
    CREATE POLICY appointments_select_admin ON public.appointments
      FOR SELECT TO authenticated USING (public.is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='appointments' AND policyname='appointments_insert_patient') THEN
    CREATE POLICY appointments_insert_patient ON public.appointments
      FOR INSERT TO authenticated
      WITH CHECK (patient_id = auth.uid() AND status = 'pending');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='appointments' AND policyname='appointments_update_patient') THEN
    CREATE POLICY appointments_update_patient ON public.appointments
      FOR UPDATE TO authenticated
      USING (patient_id = auth.uid())
      WITH CHECK (patient_id = auth.uid() AND status IN ('pending', 'confirmed', 'cancelled'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='appointments' AND policyname='appointments_update_doctor') THEN
    CREATE POLICY appointments_update_doctor ON public.appointments
      FOR UPDATE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.doctors d
        WHERE d.id = doctor_id AND d.user_id = auth.uid()
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.doctors d
        WHERE d.id = doctor_id AND d.user_id = auth.uid()
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='appointments' AND policyname='appointments_update_admin') THEN
    CREATE POLICY appointments_update_admin ON public.appointments
      FOR UPDATE TO authenticated
      USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  -- reviews: published are public; patients write one review per completed
  -- appointment (enforced by the INSERT policy against appointments);
  -- authors and reviewed doctors read their rows; admins moderate.
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='reviews_select_public') THEN
    CREATE POLICY reviews_select_public ON public.reviews
      FOR SELECT TO anon, authenticated USING (status = 'published');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='reviews_select_own') THEN
    CREATE POLICY reviews_select_own ON public.reviews
      FOR SELECT TO authenticated USING (patient_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='reviews_select_doctor') THEN
    CREATE POLICY reviews_select_doctor ON public.reviews
      FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.doctors d
        WHERE d.id = doctor_id AND d.user_id = auth.uid()
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='reviews_select_admin') THEN
    CREATE POLICY reviews_select_admin ON public.reviews
      FOR SELECT TO authenticated USING (public.is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='reviews_insert_patient') THEN
    CREATE POLICY reviews_insert_patient ON public.reviews
      FOR INSERT TO authenticated
      WITH CHECK (
        patient_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.appointments a
          WHERE a.id = appointment_id
            AND a.patient_id = auth.uid()
            AND a.doctor_id = doctor_id
            AND a.status = 'completed'
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='reviews_update_own') THEN
    CREATE POLICY reviews_update_own ON public.reviews
      FOR UPDATE TO authenticated
      USING (patient_id = auth.uid())
      WITH CHECK (patient_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='reviews_update_admin') THEN
    CREATE POLICY reviews_update_admin ON public.reviews
      FOR UPDATE TO authenticated
      USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
  -- no DELETE policy: reviews are hidden, never deleted
END $$;

DO $$
BEGIN
  -- reports: reporter creates/reads own; admins resolve
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reports' AND policyname='reports_insert_own') THEN
    CREATE POLICY reports_insert_own ON public.reports
      FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reports' AND policyname='reports_select_own') THEN
    CREATE POLICY reports_select_own ON public.reports
      FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reports' AND policyname='reports_select_admin') THEN
    CREATE POLICY reports_select_admin ON public.reports
      FOR SELECT TO authenticated USING (public.is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reports' AND policyname='reports_update_admin') THEN
    CREATE POLICY reports_update_admin ON public.reports
      FOR UPDATE TO authenticated
      USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  -- saved_doctors: strict own-row for everything (patient bookmarks)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='saved_doctors' AND policyname='saved_doctors_own') THEN
    CREATE POLICY saved_doctors_own ON public.saved_doctors
      FOR ALL TO authenticated
      USING (patient_id = auth.uid())
      WITH CHECK (patient_id = auth.uid());
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 8. Data API grants — makes the new tables reachable via PostgREST for
--    anon/authenticated. RLS still decides which ROWS each role can see.
-- -----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 9. Seed: specialties (names/descriptions match lib/constants SPECIALTIES so
--    slug resolution in the search API works) + hospitals
--    ON CONFLICT DO NOTHING — existing rows are never modified
-- -----------------------------------------------------------------------------
INSERT INTO public.specialties (id, name, description, icon) VALUES
  ('00000000-0000-0000-0000-000000000001', 'General Physician', 'Primary care and general medicine', 'stethoscope'),
  ('00000000-0000-0000-0000-000000000002', 'Cardiologist', 'Heart and cardiovascular diseases', 'heart'),
  ('00000000-0000-0000-0000-000000000003', 'Dermatologist', 'Skin, hair, and nail conditions', 'sparkles'),
  ('00000000-0000-0000-0000-000000000004', 'Orthopedic', 'Bones, joints, and musculoskeletal system', 'bone'),
  ('00000000-0000-0000-0000-000000000005', 'Pediatrician', 'Child healthcare and development', 'baby'),
  ('00000000-0000-0000-0000-000000000006', 'Gynecologist', 'Women reproductive health', 'female'),
  ('00000000-0000-0000-0000-000000000007', 'ENT Specialist', 'Ear, nose, and throat disorders', 'ear'),
  ('00000000-0000-0000-0000-000000000008', 'Neurologist', 'Nervous system disorders', 'brain'),
  ('00000000-0000-0000-0000-000000000009', 'Ophthalmologist', 'Eye and vision care', 'eye'),
  ('00000000-0000-0000-0000-000000000010', 'Psychiatrist', 'Mental health and behavioral disorders', 'brain'),
  ('00000000-0000-0000-0000-000000000011', 'Gastroenterologist', 'Digestive system disorders', 'stomach'),
  ('00000000-0000-0000-0000-000000000012', 'Pulmonologist', 'Respiratory system diseases', 'lungs'),
  ('00000000-0000-0000-0000-000000000013', 'Urologist', 'Urinary tract and male reproductive system', 'droplet'),
  ('00000000-0000-0000-0000-000000000014', 'Endocrinologist', 'Hormone and metabolic disorders', 'activity'),
  ('00000000-0000-0000-0000-000000000015', 'Nephrologist', 'Kidney diseases and dialysis', 'kidney'),
  ('00000000-0000-0000-0000-000000000016', 'Oncologist', 'Cancer diagnosis and treatment', 'shield'),
  ('00000000-0000-0000-0000-000000000017', 'Dentist', 'Oral health and dental care', 'tooth')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.hospitals (id, name, address, latitude, longitude, phone, website) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Apollo Hospitals', '154/11, Bannerghatta Road, Bengaluru, Karnataka 560076', 12.9165, 77.5946, '+91-80-26304050', 'https://www.apollohospitals.com'),
  ('10000000-0000-0000-0000-000000000002', 'Fortis Hospital', '154/9, Bannerghatta Road, Bengaluru, Karnataka 560076', 12.9158, 77.5938, '+91-80-66214444', 'https://www.fortishealthcare.com'),
  ('10000000-0000-0000-0000-000000000003', 'Manipal Hospital', '98, Rustam Bagh, Old Airport Road, Bengaluru, Karnataka 560017', 12.9592, 77.6372, '+91-80-25023333', 'https://www.manipalhospitals.com'),
  ('10000000-0000-0000-0000-000000000004', 'Columbia Asia Hospital', '26/1, Brigade Gateway, Dr. Rajkumar Road, Malleswaram, Bengaluru, Karnataka 560055', 13.0067, 77.5594, '+91-80-39898989', 'https://www.columbiaasia.com'),
  ('10000000-0000-0000-0000-000000000005', 'Narayana Health', '258/A, Bommasandra Industrial Area, Hosur Road, Bengaluru, Karnataka 560099', 12.8132, 77.6598, '+91-80-71222222', 'https://www.narayanahealth.org')
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 10. DEMO DOCTORS (optional sample data) — wrapped so that ANY failure here
--     only raises a warning: the schema above is already committed either way.
--     Creates 3 auth accounts (password Demo1234!), their profiles (via the
--     sign-up trigger), 3 VERIFIED doctor rows, hospital links and availability.
--     Re-running is a no-op thanks to ON CONFLICT DO NOTHING.
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  -- make crypt() resolvable wherever pgcrypto lives on this project
  PERFORM set_config('search_path', '$user, public, extensions', true);

  -- 10a. demo auth users (profiles auto-created by on_auth_user_created_profile)
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, aud, role, created_at, updated_at)
  VALUES
    ('d0c70001-0000-4000-8000-000000000001', 'dr.asha@mydoctor.test',   crypt('Demo1234!', gen_salt('bf')), NOW(), '{"full_name":"Dr. Asha Rao","role":"doctor"}',    'authenticated', 'authenticated', NOW() - INTERVAL '1 year', NOW()),
    ('d0c70002-0000-4000-8000-000000000002', 'dr.vikram@mydoctor.test', crypt('Demo1234!', gen_salt('bf')), NOW(), '{"full_name":"Dr. Vikram Mehta","role":"doctor"}', 'authenticated', 'authenticated', NOW() - INTERVAL '9 months', NOW()),
    ('d0c70003-0000-4000-8000-000000000003', 'dr.neha@mydoctor.test',   crypt('Demo1234!', gen_salt('bf')), NOW(), '{"full_name":"Dr. Neha Sharma","role":"doctor"}',  'authenticated', 'authenticated', NOW() - INTERVAL '6 months', NOW())
  ON CONFLICT (id) DO NOTHING;

  -- promote the auto-created demo profiles to the doctor role
  UPDATE public.profiles
  SET role = 'doctor'
  WHERE id IN (
    'd0c70001-0000-4000-8000-000000000001',
    'd0c70002-0000-4000-8000-000000000002',
    'd0c70003-0000-4000-8000-000000000003'
  ) AND role = 'patient';

  -- 10b. verified demo doctors
  INSERT INTO public.doctors (
    id, user_id, full_name, photo_url, bio, qualifications, specialization_id,
    experience_years, gender, languages, consultation_fee, latitude, longitude,
    address, medical_registration_number, registration_council,
    verification_status, rating_average, rating_count, verified_review_count,
    profile_completion_percentage, created_at, updated_at
  ) VALUES
    ('d0c70001-0000-4000-8000-000000000001', 'd0c70001-0000-4000-8000-000000000001',
     'Dr. Asha Rao', NULL,
     'Consultant cardiologist with 12 years of experience in interventional cardiology and preventive heart care.',
     ARRAY['MD (General Medicine)', 'DM (Cardiology)'], '00000000-0000-0000-0000-000000000002',
     12, 'female', ARRAY['English', 'Kannada', 'Hindi'], 800, 12.9165, 77.5946,
     '154/11, Bannerghatta Road, Bengaluru, Karnataka 560076',
     'KMC/10245', 'Karnataka Medical Council',
     'verified', 4.80, 24, 22, 100, NOW() - INTERVAL '1 year', NOW() - INTERVAL '1 year'),
    ('d0c70002-0000-4000-8000-000000000002', 'd0c70002-0000-4000-8000-000000000002',
     'Dr. Vikram Mehta', NULL,
     'General physician focused on chronic disease management, lifestyle disorders and family medicine.',
     ARRAY['MBBS', 'MD (Family Medicine)'], '00000000-0000-0000-0000-000000000001',
     8, 'male', ARRAY['English', 'Hindi', 'Marathi'], 500, 12.9158, 77.5938,
     '154/9, Bannerghatta Road, Bengaluru, Karnataka 560076',
     'KMC/10877', 'Karnataka Medical Council',
     'verified', 4.60, 18, 16, 100, NOW() - INTERVAL '9 months', NOW() - INTERVAL '9 months'),
    ('d0c70003-0000-4000-8000-000000000003', 'd0c70003-0000-4000-8000-000000000003',
     'Dr. Neha Sharma', NULL,
     'Dermatologist specialising in clinical dermatology, hair and nail disorders, and cosmetic dermatology.',
     ARRAY['MBBS', 'MD (Dermatology)'], '00000000-0000-0000-0000-000000000003',
     6, 'female', ARRAY['English', 'Hindi'], 600, 12.9165, 77.5946,
     '154/11, Bannerghatta Road, Bengaluru, Karnataka 560076',
     'KMC/11541', 'Karnataka Medical Council',
     'verified', 4.70, 12, 11, 100, NOW() - INTERVAL '6 months', NOW() - INTERVAL '6 months')
  ON CONFLICT (id) DO NOTHING;

  -- 10c. hospital affiliations
  INSERT INTO public.doctor_hospitals (doctor_id, hospital_id) VALUES
    ('d0c70001-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000001'),
    ('d0c70002-0000-4000-8000-000000000002', '10000000-0000-0000-0000-000000000002'),
    ('d0c70003-0000-4000-8000-000000000003', '10000000-0000-0000-0000-000000000001'),
    ('d0c70003-0000-4000-8000-000000000003', '10000000-0000-0000-0000-000000000002')
  ON CONFLICT DO NOTHING;

  -- 10d. availability: Mon-Sat, 09:00-13:00 and 17:00-20:00
  INSERT INTO public.availability (doctor_id, hospital_id, day_of_week, start_time, end_time, is_active)
  SELECT v.doctor_id, v.hospital_id, day, slot.start_time, slot.end_time, TRUE
  FROM (VALUES
    ('d0c70001-0000-4000-8000-000000000001'::uuid, '10000000-0000-0000-0000-000000000001'::uuid),
    ('d0c70002-0000-4000-8000-000000000002'::uuid, '10000000-0000-0000-0000-000000000002'::uuid),
    ('d0c70003-0000-4000-8000-000000000003'::uuid, '10000000-0000-0000-0000-000000000001'::uuid),
    ('d0c70003-0000-4000-8000-000000000003'::uuid, '10000000-0000-0000-0000-000000000002'::uuid)
  ) AS v(doctor_id, hospital_id)
  CROSS JOIN generate_series(1, 6) AS day
  CROSS JOIN (VALUES ('09:00'::time, '13:00'::time), ('17:00'::time, '20:00'::time)) AS slot(start_time, end_time)
  ON CONFLICT (doctor_id, hospital_id, day_of_week, start_time) DO NOTHING;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Demo doctor seed skipped (schema is still fully applied): %', SQLERRM;
END $$;

-- -----------------------------------------------------------------------------
-- 11. OPTIONAL: remove all demo data later (uncomment and run)
-- -----------------------------------------------------------------------------
-- DELETE FROM auth.users WHERE email IN
--   ('dr.asha@mydoctor.test', 'dr.vikram@mydoctor.test', 'dr.neha@mydoctor.test');
--   -- cascades: profiles -> doctors -> doctor_hospitals / availability
-- DELETE FROM public.hospitals WHERE id::text LIKE '10000000-%';
--   -- cascades: doctor_hospitals / availability / appointments referencing them
-- (specialties are real reference data — keep them)

-- -----------------------------------------------------------------------------
-- 12. Verification queries (run separately if desired)
-- -----------------------------------------------------------------------------
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- SELECT policyname, cmd, roles FROM pg_policies WHERE schemaname='public' ORDER BY tablename, policyname;
-- SELECT id, full_name, verification_status FROM public.doctors;
-- SELECT count(*) FROM public.profiles;
-- Table->FK sanity:
-- SELECT conname, conrelid::regclass AS tbl, confrelid::regclass AS ref
--   FROM pg_constraint WHERE contype='f' AND connamespace='public'::regnamespace
--   ORDER BY tbl;
