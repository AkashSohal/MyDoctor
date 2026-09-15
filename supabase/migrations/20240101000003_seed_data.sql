-- Seed Data for Development

-- Insert specialties
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

-- Insert hospitals (locations around Bangalore as demo)
INSERT INTO public.hospitals (id, name, address, latitude, longitude, phone, website) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Apollo Hospitals', '154/11, Bannerghatta Road, Bengaluru, Karnataka 560076', 12.9165, 77.5946, '+91-80-26304050', 'https://www.apollohospitals.com'),
  ('10000000-0000-0000-0000-000000000002', 'Fortis Hospital', '154/9, Bannerghatta Road, Bengaluru, Karnataka 560076', 12.9158, 77.5938, '+91-80-66214444', 'https://www.fortishealthcare.com'),
  ('10000000-0000-0000-0000-000000000003', 'Manipal Hospital', '98, Rustam Bagh, Old Airport Road, Bengaluru, Karnataka 560017', 12.9592, 77.6372, '+91-80-25023333', 'https://www.manipalhospitals.com'),
  ('10000000-0000-0000-0000-000000000004', 'Columbia Asia Hospital', '26/1, Brigade Gateway, Dr. Rajkumar Road, Malleswaram, Bengaluru, Karnataka 560055', 13.0067, 77.5594, '+91-80-39898989', 'https://www.columbiaasia.com'),
  ('10000000-0000-0000-0000-000000000005', 'Narayana Health', '258/A, Bommasandra Industrial Area, Hosur Road, Bengaluru, Karnataka 560099', 12.8132, 77.6598, '+91-80-71222222', 'https://www.narayanahealth.org')
ON CONFLICT (id) DO NOTHING;

-- Demo doctors will be inserted via a separate seed script that creates auth users first
-- This migration only creates the reference data