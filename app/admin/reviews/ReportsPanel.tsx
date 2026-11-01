'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, X } from 'lucide-react'
import { setReportStatus } from '@/app/admin/actions'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { REPORT_STATUS_LABELS, formatDate } from '@/lib/admin/format'
import { Flag } from 'lucide-react'

type ReportRow = {
  id: string
  reason: string
  status: string
  created_at: string
  review: { id: string; rating: number; review_text: string | null; status: string } | null
  reporter: { full_name: string | null } | null
  doctor: { full_name: string | null } | null
}

export function ReportsPanel({ reports }: { reports: ReportRow[] }) {
  const router = useRouter()
  const [action, setAction] = React.useState<{ id: string; status: string } | null>(null)
  const [busy, setBusy] = React.useState(false)

  const run = async (id: string, status: string, reason: string) => {
    setBusy(true)
    try {
      const res = await setReportStatus(id, status, reason)
      if (res.ok) {
        toast.success(status === 'resolved' ? 'Report resolved — review hidden' : 'Report dismissed')
        setAction(null)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } finally {
      setBusy(false)
    }
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            icon={<Flag className="h-8 w-8 text-secondary-400" />}
            title="No reports"
            description="User reports against reviews will appear here."
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardContent className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        report.status === 'pending'
                          ? 'warning'
                          : report.status === 'resolved'
                            ? 'success'
                            : 'outline'
                      }
                    >
                      {REPORT_STATUS_LABELS[report.status] ?? report.status}
                    </Badge>
                    <span className="text-xs text-secondary-400">{formatDate(report.created_at)}</span>
                  </div>
                  <p className="mt-2 text-sm text-secondary-800">
                    <span className="font-semibold">{report.reporter?.full_name ?? 'User'}</span> reported
                    the review by <span className="font-semibold">{report.doctor?.full_name ?? 'patient'}</span>:
                  </p>
                  <p className="mt-1 rounded-xl bg-secondary-50 px-3 py-2 text-sm text-secondary-600">
                    {report.reason}
                  </p>
                  {report.review && (
                    <p className="mt-2 text-xs text-secondary-500">
                      Review ({report.review.rating}★, {report.review.status}):{' '}
                      <span className="italic">“{report.review.review_text ?? 'no text'}”</span>
                    </p>
                  )}
                </div>
                {report.status === 'pending' && (
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" onClick={() => setAction({ id: report.id, status: 'resolved' })}>
                      <Check className="mr-1.5 h-4 w-4" /> Resolve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAction({ id: report.id, status: 'dismissed' })}
                    >
                      <X className="mr-1.5 h-4 w-4" /> Dismiss
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(action)}
        title={action?.status === 'resolved' ? 'Resolve report' : 'Dismiss report'}
        description={
          action?.status === 'resolved'
            ? 'Resolving hides the reported review from the public site. A reason is stored in the audit log.'
            : 'The report is closed without hiding the review.'
        }
        variant={action?.status === 'resolved' ? 'destructive' : 'default'}
        confirmLabel={action?.status === 'resolved' ? 'Resolve & hide' : 'Dismiss'}
        requireReason
        loading={busy}
        onCancel={() => setAction(null)}
        onConfirm={(reason) => action && run(action.id, action.status, reason)}
      />
    </>
  )
}
