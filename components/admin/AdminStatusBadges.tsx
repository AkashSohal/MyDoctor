import React from 'react'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, AlertCircle, Star } from 'lucide-react'

export function DoctorVerificationBadge({ status }: { status: string }) {
  const badges: Record<string, React.ReactNode> = {
    pending: <Badge variant="warning"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>,
    verified: <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" /> Verified</Badge>,
    rejected: <Badge variant="danger"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>,
    suspended: <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" /> Suspended</Badge>,
  }
  return badges[status] || <Badge>{status}</Badge>
}

export function AppointmentStatusBadge({ status }: { status: string }) {
  const badges: Record<string, React.ReactNode> = {
    pending: <Badge variant="warning"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>,
    confirmed: <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" /> Confirmed</Badge>,
    cancelled: <Badge variant="danger"><XCircle className="h-3 w-3 mr-1" /> Cancelled</Badge>,
    completed: <Badge variant="default"><Star className="h-3 w-3 mr-1" /> Completed</Badge>,
    rejected: <Badge variant="danger"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>,
  }
  return badges[status] || <Badge>{status}</Badge>
}

export function ReviewStatusBadge({ status }: { status: string }) {
  const badges: Record<string, React.ReactNode> = {
    published: <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" /> Published</Badge>,
    pending_moderation: <Badge variant="warning"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>,
    reported: <Badge variant="danger"><AlertCircle className="h-3 w-3 mr-1" /> Reported</Badge>,
    hidden: <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" /> Hidden</Badge>,
  }
  return badges[status] || <Badge>{status}</Badge>
}

export function ReportStatusBadge({ status }: { status: string }) {
  const badges: Record<string, React.ReactNode> = {
    pending: <Badge variant="warning"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>,
    resolved: <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" /> Resolved</Badge>,
    dismissed: <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" /> Dismissed</Badge>,
  }
  return badges[status] || <Badge>{status}</Badge>
}

export function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-secondary-300'}`}
        />
      ))}
      <span className="text-sm text-secondary-500 ml-1">{rating.toFixed(1)}</span>
    </div>
  )
}
