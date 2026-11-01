export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return '—'
  const [h, m] = value.split(':')
  const hour = Number(h)
  if (Number.isNaN(hour)) return value
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const display = hour % 12 || 12
  return `${display}:${m ?? '00'} ${suffix}`
}

export function formatFee(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return `₹${value.toLocaleString('en-IN')}`
}

export const DOCTOR_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  verified: 'Verified',
  rejected: 'Rejected',
  suspended: 'Suspended',
}

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const REVIEW_STATUS_LABELS: Record<string, string> = {
  published: 'Published',
  reported: 'Reported',
  hidden: 'Hidden',
  pending_moderation: 'Pending moderation',
}

export const REPORT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
}

export function doctorStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'verified':
      return 'success'
    case 'pending':
      return 'warning'
    case 'rejected':
    case 'suspended':
      return 'danger'
    default:
      return 'info'
  }
}

export function appointmentStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'completed':
      return 'success'
    case 'confirmed':
      return 'info'
    case 'pending':
      return 'warning'
    case 'cancelled':
      return 'danger'
    default:
      return 'info'
  }
}

export function reviewStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'outline' {
  switch (status) {
    case 'published':
      return 'success'
    case 'reported':
      return 'danger'
    case 'pending_moderation':
      return 'warning'
    default:
      return 'outline'
  }
}
