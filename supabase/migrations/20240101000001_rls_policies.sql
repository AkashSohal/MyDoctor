-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_doctors ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can read all users
CREATE POLICY "Admins can read all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Admins can update all users
CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ============================================
-- SPECIALTIES TABLE POLICIES
-- ============================================

-- Anyone can read specialties
CREATE POLICY "Anyone can read specialties" ON public.specialties
  FOR SELECT USING (TRUE);

-- Only admins can insert specialties
CREATE POLICY "Admins can insert specialties" ON public.specialties
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Only admins can update specialties
CREATE POLICY "Admins can update specialties" ON public.specialties
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Only admins can delete specialties
CREATE POLICY "Admins can delete specialties" ON public.specialties
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ============================================
-- HOSPITALS TABLE POLICIES
-- ============================================

-- Anyone can read hospitals
CREATE POLICY "Anyone can read hospitals" ON public.hospitals
  FOR SELECT USING (TRUE);

-- Only admins can insert hospitals
CREATE POLICY "Admins can insert hospitals" ON public.hospitals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Only admins can update hospitals
CREATE POLICY "Admins can update hospitals" ON public.hospitals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Only admins can delete hospitals
CREATE POLICY "Admins can delete hospitals" ON public.hospitals
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ============================================
-- DOCTORS TABLE POLICIES
-- ============================================

-- Anyone can read verified doctors
CREATE POLICY "Anyone can read verified doctors" ON public.doctors
  FOR SELECT USING (verification_status = 'verified');

-- Doctors can read their own profile (any status)
CREATE POLICY "Doctors can read own profile" ON public.doctors
  FOR SELECT USING (user_id = auth.uid());

-- Admins can read all doctors
CREATE POLICY "Admins can read all doctors" ON public.doctors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Doctors can update their own profile
CREATE POLICY "Doctors can update own profile" ON public.doctors
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can update any doctor (including verification status)
CREATE POLICY "Admins can update any doctor" ON public.doctors
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Doctors can insert their own profile
CREATE POLICY "Doctors can insert own profile" ON public.doctors
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================
-- DOCTOR_HOSPITALS TABLE POLICIES
-- ============================================

-- Anyone can read doctor-hospital relationships for verified doctors
CREATE POLICY "Anyone can read doctor-hospitals" ON public.doctor_hospitals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.id = doctor_id AND d.verification_status = 'verified'
    )
  );

-- Doctors can manage their own hospital relationships
CREATE POLICY "Doctors can manage own hospitals" ON public.doctor_hospitals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.id = doctor_id AND d.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.id = doctor_id AND d.user_id = auth.uid()
    )
  );

-- Admins can manage all doctor-hospital relationships
CREATE POLICY "Admins can manage all doctor-hospitals" ON public.doctor_hospitals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ============================================
-- AVAILABILITY TABLE POLICIES
-- ============================================

-- Anyone can read availability for verified doctors
CREATE POLICY "Anyone can read availability" ON public.availability
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.id = doctor_id AND d.verification_status = 'verified'
    )
  );

-- Doctors can manage their own availability
CREATE POLICY "Doctors can manage own availability" ON public.availability
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.id = doctor_id AND d.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.id = doctor_id AND d.user_id = auth.uid()
    )
  );

-- Admins can manage all availability
CREATE POLICY "Admins can manage all availability" ON public.availability
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ============================================
-- APPOINTMENTS TABLE POLICIES
-- ============================================

-- Patients can read their own appointments
CREATE POLICY "Patients can read own appointments" ON public.appointments
  FOR SELECT USING (patient_id = auth.uid());

-- Doctors can read their own appointments
CREATE POLICY "Doctors can read own appointments" ON public.appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.id = doctor_id AND d.user_id = auth.uid()
    )
  );

-- Admins can read all appointments
CREATE POLICY "Admins can read all appointments" ON public.appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Patients can create appointments
CREATE POLICY "Patients can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (patient_id = auth.uid());

-- Patients can update their own appointments (cancel)
CREATE POLICY "Patients can update own appointments" ON public.appointments
  FOR UPDATE USING (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid());

-- Doctors can update their appointments (confirm/reject/complete)
CREATE POLICY "Doctors can update own appointments" ON public.appointments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.id = doctor_id AND d.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.id = doctor_id AND d.user_id = auth.uid()
    )
  );

-- Admins can update any appointment
CREATE POLICY "Admins can update any appointment" ON public.appointments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ============================================
-- REVIEWS TABLE POLICIES
-- ============================================

-- Anyone can read published reviews
CREATE POLICY "Anyone can read published reviews" ON public.reviews
  FOR SELECT USING (status = 'published');

-- Patients can read their own reviews (any status)
CREATE POLICY "Patients can read own reviews" ON public.reviews
  FOR SELECT USING (patient_id = auth.uid());

-- Doctors can read reviews for their profile
CREATE POLICY "Doctors can read own reviews" ON public.reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.id = doctor_id AND d.user_id = auth.uid()
    )
  );

-- Admins can read all reviews
CREATE POLICY "Admins can read all reviews" ON public.reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Patients can create reviews for completed appointments
CREATE POLICY "Patients can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (
    patient_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_id
      AND a.patient_id = auth.uid()
      AND a.status = 'completed'
      AND a.doctor_id = doctor_id
    )
  );

-- Patients can update their own reviews (within time limit)
CREATE POLICY "Patients can update own reviews" ON public.reviews
  FOR UPDATE USING (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid());

-- Admins can update any review (moderation)
CREATE POLICY "Admins can update any review" ON public.reviews
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ============================================
-- REPORTS TABLE POLICIES
-- ============================================

-- Users can create reports
CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can read their own reports
CREATE POLICY "Users can read own reports" ON public.reports
  FOR SELECT USING (user_id = auth.uid());

-- Admins can read all reports
CREATE POLICY "Admins can read all reports" ON public.reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Admins can update reports
CREATE POLICY "Admins can update reports" ON public.reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ============================================
-- SAVED_DOCTORS TABLE POLICIES
-- ============================================

-- Patients can manage their saved doctors
CREATE POLICY "Patients can manage saved doctors" ON public.saved_doctors
  FOR ALL USING (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid());