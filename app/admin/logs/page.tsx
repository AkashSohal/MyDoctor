import * as React from 'react'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { formatDateTime } from '@/lib/admin/format'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { UrlPagination } from '@/components/admin/UrlPagination'
import { ClipboardList, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

const PER_PAGE = 30

const ENTITY_OPTIONS = [
  { value: '', label: 'All entities' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'profile', label: 'Patient / profile' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'specialty', label: 'Specialty' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'review', label: 'Review' },
  { value: 'report', label: 'Report' },
  { value: 'doctor_hospital', label: 'Doctor–hospital link' },
]

function prettify(action: string) {
  return action
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: { entity?: string; admin?: string; page?: string }
}) {
  const { supabase } = await requireAdmin()
  const page = Math.max(1, Number(searchParams.page) || 1)
  const entity = (searchParams.entity ?? '').trim()

  let query = supabase
    .from('admin_audit_logs')
    .select('id, action, entity_type, entity_id, reason, details, created_at, admin:profiles(full_name, email)', {
      count: 'exact',
    })

  if (entity) query = query.eq('entity_type', entity)

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * PER_PAGE, page * PER_PAGE - 1)

  const logs = (data ?? []) as any[]
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  return (
    <div>
      <PageHeader
        title="Activity Logs"
        description="Immutable audit trail of administrative actions."
      />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <form className="grid grid-cols-1 gap-3 sm:grid-cols-3" action="/admin/logs" method="get">
            <Select name="entity" defaultValue={entity}>
              {ENTITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" /> Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardContent>
            <EmptyState title="Failed to load logs" description={error.message} />
          </CardContent>
        </Card>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<ClipboardList className="h-8 w-8 text-secondary-400" />}
              title="No log entries"
              description="Administrative actions will be recorded here automatically."
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-secondary-200 bg-secondary-50/60 text-left text-xs uppercase tracking-wide text-secondary-500">
                    <th className="px-5 py-3 font-semibold">When</th>
                    <th className="px-5 py-3 font-semibold">Admin</th>
                    <th className="px-5 py-3 font-semibold">Action</th>
                    <th className="px-5 py-3 font-semibold">Entity</th>
                    <th className="px-5 py-3 font-semibold">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="align-top transition-colors hover:bg-secondary-50/60">
                      <td className="whitespace-nowrap px-5 py-3.5 text-secondary-500">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-secondary-900">
                          {log.admin?.full_name ?? 'Unknown'}
                        </p>
                        <p className="text-xs text-secondary-400">{log.admin?.email ?? ''}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant={
                            log.action.includes('deleted')
                              ? 'danger'
                              : log.action.includes('suspended') || log.action.includes('rejected') || log.action.includes('cancelled')
                                ? 'warning'
                                : 'default'
                          }
                        >
                          {prettify(log.action)}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-secondary-600">
                        <span>{log.entity_type}</span>
                        {log.entity_id && (
                          <span className="block max-w-[10rem] truncate text-xs text-secondary-400">
                            {log.entity_id}
                          </span>
                        )}
                      </td>
                      <td className="max-w-xs px-5 py-3.5 text-secondary-600">
                        {log.reason || <span className="text-secondary-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <UrlPagination totalPages={totalPages} totalItems={total} itemsPerPage={PER_PAGE} />
    </div>
  )
}
