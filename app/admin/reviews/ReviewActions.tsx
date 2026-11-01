'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { EyeOff, ShieldCheck, Trash2 } from 'lucide-react'
import { deleteReview, setReviewStatus } from '@/app/admin/actions'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'

export function ReviewActions({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const [action, setAction] = React.useState<'publish' | 'hide' | 'delete' | null>(null)
  const [busy, setBusy] = React.useState(false)

  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) => {
    setBusy(true)
    try {
      const res = await fn()
      if (res.ok) {
        toast.success(success)
        setAction(null)
        router.refresh()
      } else {
        toast.error(res.error ?? 'Operation failed')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="flex shrink-0 flex-wrap gap-2">
        {status !== 'published' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => run(() => setReviewStatus(id, 'published'), 'Review published')}
          >
            <ShieldCheck className="mr-1.5 h-4 w-4" /> Publish
          </Button>
        )}
        {status !== 'hidden' && (
          <Button size="sm" variant="outline" onClick={() => setAction('hide')}>
            <EyeOff className="mr-1.5 h-4 w-4" /> Hide
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="text-red-600 hover:bg-red-50"
          onClick={() => setAction('delete')}
        >
          <Trash2 className="mr-1.5 h-4 w-4" /> Remove
        </Button>
      </div>

      <ConfirmDialog
        open={action === 'hide'}
        title="Hide review"
        description="Hidden reviews stay in the database but are not shown publicly. Provide a reason for the audit log."
        variant="destructive"
        confirmLabel="Hide review"
        requireReason
        loading={busy}
        onCancel={() => setAction(null)}
        onConfirm={(reason) =>
          run(() => setReviewStatus(id, 'hidden', reason), 'Review hidden')
        }
      />

      <ConfirmDialog
        open={action === 'delete'}
        title="Remove review permanently"
        description="Deleting a review is irreversible and is recorded in the audit log with your reason. Prefer hiding unless the content is unlawful or abusive."
        variant="destructive"
        confirmLabel="Delete review"
        requireReason
        loading={busy}
        onCancel={() => setAction(null)}
        onConfirm={(reason) => run(() => deleteReview(id, reason), 'Review removed')}
      />
    </>
  )
}
