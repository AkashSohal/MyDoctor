export const SPECIALTIES = [
  { id: 'general-physician', name: 'General Physician', icon: 'stethoscope', description: 'Primary care and general medicine' },
  { id: 'cardiologist', name: 'Cardiologist', icon: 'heart', description: 'Heart and cardiovascular diseases' },
  { id: 'dermatologist', name: 'Dermatologist', icon: 'sparkles', description: 'Skin, hair, and nail conditions' },
  { id: 'orthopedic', name: 'Orthopedic', icon: 'bone', description: 'Bones, joints, and musculoskeletal system' },
  { id: 'pediatrician', name: 'Pediatrician', icon: 'baby', description: 'Child healthcare and development' },
  { id: 'gynecologist', name: 'Gynecologist', icon: 'female', description: 'Women reproductive health' },
  { id: 'ent-specialist', name: 'ENT Specialist', icon: 'ear', description: 'Ear, nose, and throat disorders' },
  { id: 'neurologist', name: 'Neurologist', icon: 'brain', description: 'Nervous system disorders' },
  { id: 'ophthalmologist', name: 'Ophthalmologist', icon: 'eye', description: 'Eye and vision care' },
  { id: 'psychiatrist', name: 'Psychiatrist', icon: 'brain', description: 'Mental health and behavioral disorders' },
  { id: 'gastroenterologist', name: 'Gastroenterologist', icon: 'stomach', description: 'Digestive system disorders' },
  { id: 'pulmonologist', name: 'Pulmonologist', icon: 'lungs', description: 'Respiratory system diseases' },
  { id: 'urologist', name: 'Urologist', icon: 'droplet', description: 'Urinary tract and male reproductive system' },
  { id: 'endocrinologist', name: 'Endocrinologist', icon: 'activity', description: 'Hormone and metabolic disorders' },
  { id: 'nephrologist', name: 'Nephrologist', icon: 'kidney', description: 'Kidney diseases and dialysis' },
  { id: 'oncologist', name: 'Oncologist', icon: 'shield', description: 'Cancer diagnosis and treatment' },
  { id: 'dentist', name: 'Dentist', icon: 'tooth', description: 'Oral health and dental care' },
] as const

export const DISTANCE_FILTERS = [
  { value: 1, label: 'Within 1 km' },
  { value: 2, label: 'Within 2 km' },
  { value: 5, label: 'Within 5 km' },
  { value: 10, label: 'Within 10 km' },
  { value: 25, label: 'Within 25 km' },
] as const

export const SORT_OPTIONS = [
  { value: 'best_match', label: 'Best Match' },
  { value: 'nearest', label: 'Nearest' },
  { value: 'highest_rated', label: 'Highest Rated' },
  { value: 'most_experienced', label: 'Most Experienced' },
  { value: 'available_today', label: 'Available Today' },
  { value: 'lowest_fee', label: 'Lowest Consultation Fee' },
] as const

export const MATCH_SCORE_WEIGHTS = {
  specialty_match: 0.30,
  patient_rating: 0.20,
  verified_profile: 0.15,
  relevant_experience: 0.15,
  availability: 0.10,
  distance: 0.10,
} as const

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
] as const

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
] as const

export const LANGUAGES = [
  'English', 'Hindi', 'Punjabi', 'Gujarati', 'Marathi', 'Bengali', 'Tamil', 'Telugu', 'Kannada', 'Malayalam',
  'Urdu', 'Odia', 'Assamese', 'Kashmiri', 'Sindhi', 'Nepali', 'Konkani', 'Manipuri'
] as const

export const VERIFICATION_STATUS = {
  pending: { label: 'Verification Pending', color: 'yellow', icon: 'clock' },
  verified: { label: 'Verified Doctor', color: 'green', icon: 'check-circle' },
  rejected: { label: 'Verification Rejected', color: 'red', icon: 'x-circle' },
  suspended: { label: 'Suspended', color: 'gray', icon: 'alert-circle' },
} as const

export const APPOINTMENT_STATUS = {
  pending: { label: 'Pending', color: 'yellow' },
  confirmed: { label: 'Confirmed', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'red' },
  completed: { label: 'Completed', color: 'blue' },
  rejected: { label: 'Rejected', color: 'gray' },
} as const

export const REVIEW_STATUS = {
  published: { label: 'Published', color: 'green' },
  reported: { label: 'Reported', color: 'orange' },
  hidden: { label: 'Hidden', color: 'gray' },
  pending_moderation: { label: 'Pending Moderation', color: 'yellow' },
} as const

export const EXAMPLE_SEARCHES = [
  'Cardiologist near me',
  'Skin specialist',
  'Child specialist',
  'Orthopedic doctor',
  'General physician',
  'Dr. Rahul Sharma',
  'ABC Hospital',
] as const

export const RATING_ADJUSTMENT = {
  min_reviews_for_full_weight: 10,
  max_reviews_for_full_weight: 100,
} as const