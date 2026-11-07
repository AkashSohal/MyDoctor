'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { updateDoctorProfileAction } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Doctor } from '@/lib/types'
import { formatDoctorName, formatExperienceYears } from '@/lib/utils/doctor'
import {
  Award,
  Briefcase,
  Calendar,
  CheckCircle,
  Edit,
  GraduationCap,
  ImagePlus,
  Languages,
  Loader2,
  Mail,
  Phone,
  Plus,
  Save,
  Stethoscope,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react'

interface DoctorProfileEditorProps {
  doctor: Doctor
  profile: {
    full_name?: string | null
    phone?: string | null
    email?: string | null
  }
  specialties: { id: string; name: string }[]
  userId: string
  /** Increment from the dashboard to open the editor (e.g. Quick Actions). */
  editRequest: number
  onManageAvailability: () => void
}

interface ProfileFormState {
  full_name: string
  phone: string
  photo_url: string | null
  specialization_id: string
  qualifications: string[]
  languages: string[]
  experience_years: string
  consultation_fee: string
  bio: string
  gender: '' | 'male' | 'female' | 'other'
}

const PHONE_RE = /^[+()\-0-9\s]{6,20}$/

function toFormState(doctor: Doctor, profile: DoctorProfileEditorProps['profile']): ProfileFormState {
  return {
    full_name: doctor.full_name ?? '',
    phone: profile.phone ?? '',
    photo_url: doctor.photo_url ?? null,
    specialization_id: doctor.specialization_id ?? '',
    qualifications: Array.isArray(doctor.qualifications) ? [...doctor.qualifications] : [],
    languages: Array.isArray(doctor.languages) ? [...doctor.languages] : [],
    experience_years: String(doctor.experience_years ?? 0),
    consultation_fee: String(doctor.consultation_fee ?? 0),
    bio: doctor.bio ?? '',
    gender: (doctor.gender ?? '') as ProfileFormState['gender'],
  }
}

export function DoctorProfileEditor({
  doctor,
  profile,
  specialties,
  userId,
  editRequest,
  onManageAvailability,
}: DoctorProfileEditorProps) {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])
  const [editing, setEditing] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [uploadingPhoto, setUploadingPhoto] = React.useState(false)
  const [form, setForm] = React.useState<ProfileFormState>(() => toFormState(doctor, profile))
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [formError, setFormError] = React.useState('')
  const [qualificationInput, setQualificationInput] = React.useState('')
  const [languageInput, setLanguageInput] = React.useState('')
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (!editing) {
      setForm(toFormState(doctor, profile))
    }
  }, [doctor, profile, editing])

  React.useEffect(() => {
    if (editRequest > 0) setEditing(true)
  }, [editRequest])

  const set = <K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const addTag = (key: 'qualifications' | 'languages', raw: string, clear: () => void) => {
    const value = raw.trim()
    if (!value) return
    setForm((current) => {
      const exists = current[key].some((item) => item.toLowerCase() === value.toLowerCase())
      if (exists) return current
      return { ...current, [key]: [...current[key], value] }
    })
    clear()
  }

  const removeTag = (key: 'qualifications' | 'languages', value: string) => {
    setForm((current) => ({ ...current, [key]: current[key].filter((item) => item !== value) }))
  }

  const handlePhotoUpload = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Profile photos must be smaller than 5MB')
      return
    }

    setUploadingPhoto(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`
      const { error } = await supabase.storage
        .from('doctor-uploads')
        .upload(path, file, { contentType: file.type, upsert: false })

      if (error) {
        const notReady = /bucket|not found/i.test(error.message)
        throw new Error(
          notReady
            ? 'Photo uploads are not enabled yet. Please ask support to apply the latest database migration.'
            : `Photo upload failed: ${error.message}`
        )
      }

      const { data } = supabase.storage.from('doctor-uploads').getPublicUrl(path)
      if (!data?.publicUrl) throw new Error('Could not resolve the uploaded photo URL')

      set('photo_url', data.publicUrl)
      toast.success('Profile photo uploaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Photo upload failed')
    } finally {
      setUploadingPhoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {}
    if (!form.full_name.trim()) next.full_name = 'Full name is required'
    else if (form.full_name.trim().length > 120) next.full_name = 'Full name is too long'
    if (form.phone.trim() && !PHONE_RE.test(form.phone.trim())) {
      next.phone = 'Enter a valid contact number'
    }
    if (form.qualifications.length === 0) {
      next.qualifications = 'Add at least one qualification'
    }
    const experience = Number(form.experience_years)
    if (!Number.isFinite(experience) || experience < 0 || experience > 80) {
      next.experience_years = 'Enter a value between 0 and 80'
    }
    const fee = Number(form.consultation_fee)
    if (!Number.isFinite(fee) || fee < 0 || fee > 1000000) {
      next.consultation_fee = 'Enter a valid consultation fee'
    }
    return next
  }

  const confirmClearedFields = (): boolean => {
    const cleared: string[] = []
    if (doctor.bio && !form.bio.trim()) cleared.push('professional bio')
    if (doctor.photo_url && !form.photo_url) cleared.push('profile photo')
    if ((doctor.languages?.length ?? 0) > 0 && form.languages.length === 0) {
      cleared.push('languages')
    }
    if (cleared.length === 0) return true
    return window.confirm(
      `You are about to remove your ${cleared.join(', ')}. This will also update your public profile. Continue?`
    )
  }

  const handleSave = async () => {
    if (saving) return

    const nextErrors = validate()
    setErrors(nextErrors)
    setFormError('')

    if (Object.keys(nextErrors).length > 0) {
      toast.error('Please fix the highlighted fields before saving')
      return
    }

    if (!confirmClearedFields()) return

    setSaving(true)
    try {
      const result = await updateDoctorProfileAction({
        full_name: form.full_name,
        phone: form.phone,
        photo_url: form.photo_url,
        specialization_id: form.specialization_id,
        qualifications: form.qualifications,
        languages: form.languages,
        experience_years: Number(form.experience_years),
        consultation_fee: Number(form.consultation_fee),
        bio: form.bio,
        gender: form.gender || null,
      })

      if (!result.ok) {
        setFormError(result.error)
        toast.error(result.error)
        return
      }

      toast.success('Profile updated successfully', {
        description: 'Your changes are now live on your public doctor profile.',
      })
      setEditing(false)
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setFormError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const cancelEditing = () => {
    setForm(toFormState(doctor, profile))
    setErrors({})
    setFormError('')
    setEditing(false)
  }

  const displayName = formatDoctorName(form.full_name || doctor.full_name)
  const specializationName =
    specialties.find((s) => s.id === (form.specialization_id || doctor.specialization_id))?.name ||
    doctor.specialization?.name ||
    'Specialist'

  return (
    <div className="space-y-6">
      {/* Identity / header */}
      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary-500 to-teal-500" />
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar src={form.photo_url} fallback={displayName} size="xl" />
                {editing && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white shadow-md transition-colors hover:bg-primary-700 disabled:opacity-60"
                    aria-label="Upload profile photo"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImagePlus className="h-4 w-4" />
                    )}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-secondary-900">{displayName}</h2>
                <p className="text-secondary-500">
                  {specializationName} • {formatExperienceYears(doctor.experience_years)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge
                    variant={
                      doctor.verification_status === 'verified'
                        ? 'success'
                        : doctor.verification_status === 'rejected'
                          ? 'danger'
                          : 'warning'
                    }
                  >
                    {doctor.verification_status === 'verified'
                      ? 'Verified doctor'
                      : doctor.verification_status === 'rejected'
                        ? 'Verification rejected'
                        : 'Verification pending'}
                  </Badge>
                  {profile.email && (
                    <span className="inline-flex items-center gap-1 text-xs text-secondary-500">
                      <Mail className="h-3 w-3" />
                      {profile.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {!editing ? (
              <Button onClick={() => setEditing(true)} className="shrink-0">
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" onClick={cancelEditing} disabled={saving}>
                  <X className="mr-1.5 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleSave} loading={saving}>
                  <Save className="mr-1.5 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>

          {editing && (
            <div className="mt-5 rounded-xl border border-dashed border-secondary-300 bg-secondary-50 p-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-secondary-600">
                  <Upload className="h-4 w-4" />
                  Profile photo
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  loading={uploadingPhoto}
                >
                  {form.photo_url ? 'Replace photo' : 'Upload photo'}
                </Button>
                {form.photo_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => set('photo_url', null)}
                    disabled={uploadingPhoto}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Remove
                  </Button>
                )}
                <span className="text-xs text-secondary-400">PNG, JPG or WebP, up to 5MB.</span>
              </div>
            </div>
          )}

          {formError && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {formError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
              <User className="h-5 w-5" />
            </span>
            Personal Information
          </CardTitle>
          <CardDescription>Your name and contact details visible to MyDoctor.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {editing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Full Name *"
                value={form.full_name}
                onChange={(e) => set('full_name', e.target.value)}
                error={errors.full_name}
                maxLength={120}
                placeholder="e.g., Dr. Asha Rao"
              />
              <Input
                label="Contact Number"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                error={errors.phone}
                placeholder="e.g., +91 98765 43210"
                maxLength={30}
              />
              <div className="sm:col-span-2">
                <Label>Email Address</Label>
                <Input value={profile.email ?? 'Not available'} disabled className="mt-1.5" />
                <p className="mt-1 text-xs text-secondary-400">
                  Email changes are handled securely through account settings.
                </p>
              </div>
              <div>
                <Label>Gender</Label>
                <Select
                  value={form.gender}
                  onChange={(e) => set('gender', e.target.value as ProfileFormState['gender'])}
                  className="mt-1.5"
                >
                  <option value="">Not specified</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Select>
              </div>
            </div>
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2">
              <InfoRow icon={<User className="h-4 w-4" />} label="Full name" value={doctor.full_name} />
              <InfoRow
                icon={<Phone className="h-4 w-4" />}
                label="Contact number"
                value={profile.phone || 'Not provided'}
              />
              <InfoRow
                icon={<Mail className="h-4 w-4" />}
                label="Email address"
                value={profile.email || 'Not available'}
              />
              <InfoRow
                icon={<User className="h-4 w-4" />}
                label="Gender"
                value={doctor.gender ? doctor.gender.charAt(0).toUpperCase() + doctor.gender.slice(1) : 'Not specified'}
              />
            </dl>
          )}
        </CardContent>
      </Card>

      {/* Professional information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
              <Stethoscope className="h-5 w-5" />
            </span>
            Professional Information
          </CardTitle>
          <CardDescription>
            These details appear on your public profile and in Find Doctors results.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {editing ? (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Specialization</Label>
                  <Select
                    value={form.specialization_id}
                    onChange={(e) => set('specialization_id', e.target.value)}
                    className="mt-1.5"
                  >
                    <option value="">Select specialization</option>
                    {specialties.map((specialty) => (
                      <option key={specialty.id} value={specialty.id}>
                        {specialty.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <Input
                  label="Years of Experience *"
                  type="number"
                  min={0}
                  max={80}
                  value={form.experience_years}
                  onChange={(e) => set('experience_years', e.target.value)}
                  error={errors.experience_years}
                />
                <Input
                  label="Consultation Fee (₹) *"
                  type="number"
                  min={0}
                  max={1000000}
                  value={form.consultation_fee}
                  onChange={(e) => set('consultation_fee', e.target.value)}
                  error={errors.consultation_fee}
                />
              </div>

              <div>
                <Label>Qualifications *</Label>
                <div className="mt-1.5 flex gap-2">
                  <Input
                    value={qualificationInput}
                    onChange={(e) => setQualificationInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag('qualifications', qualificationInput, () => setQualificationInput(''))
                      }
                    }}
                    placeholder="e.g., MBBS, MD (Cardiology)"
                    error={errors.qualifications}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addTag('qualifications', qualificationInput, () => setQualificationInput(''))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.qualifications.map((qualification) => (
                    <Badge key={qualification} variant="outline" size="lg" className="gap-1.5">
                      {qualification}
                      <button
                        type="button"
                        onClick={() => removeTag('qualifications', qualification)}
                        className="rounded-full text-secondary-500 hover:text-red-600"
                        aria-label={`Remove ${qualification}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {form.qualifications.length === 0 && (
                    <span className="text-xs text-secondary-400">Add at least one qualification.</span>
                  )}
                </div>
              </div>

              <div>
                <Label>Languages Spoken</Label>
                <div className="mt-1.5 flex gap-2">
                  <Input
                    value={languageInput}
                    onChange={(e) => setLanguageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag('languages', languageInput, () => setLanguageInput(''))
                      }
                    }}
                    placeholder="e.g., English, Hindi"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addTag('languages', languageInput, () => setLanguageInput(''))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.languages.map((language) => (
                    <Badge key={language} variant="outline" size="lg" className="gap-1.5">
                      {language}
                      <button
                        type="button"
                        onClick={() => removeTag('languages', language)}
                        className="rounded-full text-secondary-500 hover:text-red-600"
                        aria-label={`Remove ${language}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <Textarea
                label="About / Professional Bio"
                rows={5}
                value={form.bio}
                onChange={(e) => set('bio', e.target.value)}
                placeholder="Tell patients about your approach, specialties and experience..."
                maxLength={3000}
              />
            </div>
          ) : (
            <div className="space-y-5">
              <dl className="grid gap-4 sm:grid-cols-2">
                <InfoRow
                  icon={<Stethoscope className="h-4 w-4" />}
                  label="Specialization"
                  value={specializationName}
                />
                <InfoRow
                  icon={<Award className="h-4 w-4" />}
                  label="Experience"
                  value={formatExperienceYears(doctor.experience_years)}
                />
                <InfoRow
                  icon={<Briefcase className="h-4 w-4" />}
                  label="Consultation fee"
                  value={`₹${doctor.consultation_fee ?? 0}`}
                />
                <InfoRow
                  icon={<GraduationCap className="h-4 w-4" />}
                  label="Qualifications"
                  value={doctor.qualifications?.join(', ') || 'Not listed'}
                />
                <InfoRow
                  icon={<Languages className="h-4 w-4" />}
                  label="Languages"
                  value={doctor.languages?.join(', ') || 'Not listed'}
                />
                <InfoRow
                  icon={<CheckCircle className="h-4 w-4" />}
                  label="Registration"
                  value={`${doctor.medical_registration_number || 'Not listed'}${
                    doctor.registration_council ? ` • ${doctor.registration_council}` : ''
                  }`}
                />
              </dl>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-secondary-500">
                  About / Professional Bio
                </p>
                <p className="whitespace-pre-wrap rounded-xl bg-secondary-50 p-4 text-sm text-secondary-700">
                  {doctor.bio || 'No bio added yet.'}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-xl border border-primary-100 bg-primary-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2 text-sm text-secondary-700">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
              <span>Availability is managed separately so patients can book open slots.</span>
            </div>
            <Button type="button" variant="outline" onClick={onManageAvailability} className="shrink-0">
              Manage Availability
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className={cn('rounded-xl border border-secondary-100 bg-secondary-50/60 p-4')}>
      <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-secondary-500">
        <span className="text-primary-600">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1.5 break-words text-sm font-medium text-secondary-900">{value}</dd>
    </div>
  )
}
