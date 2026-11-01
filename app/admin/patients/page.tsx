import * as React from 'react'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { formatDate } from '@/lib/admin/format'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { UrlPagination } from '@/components/admin/UrlPagination'
import { Search, Users, X } from 'lucide-react'

export const dynamic = 'force-dynamic'

const PER_PAGE = 20

export default async function AdminPatientsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; page?: string }
}) {
  const { supabase } = await requireAdmin()

  const page = Math.max(1, Number(searchParams.page) || 1)
  const q = (searchParams.q ?? '').trim()
  const status = (searchParams.status ?? '').trim()

  let query = supabase
    .from('profiles')
    .select('id, full_name, email, phone, status, created_at, last_login_at', { count: 'exact' })
    .eq('role', 'patient')

  if (status === 'active' || status === 'suspended') query = query.eq('status', status)
  if (q) {
    if (q.includes('@')) {
      query = query.ilike('email', `%${q}%`)
    } else if (/^\+?[\d\s-]{6,}$/.test(q)) {
      query = query.ilike('phone', `%${q}%`)
    } else {
      query = query.ilike('full_name', `%${q}%`)
    }
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * PER_PAGE, page * PER_PAGE - 1)

  const patients = (data ?? []) as any[]
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  return (
    <div>
      <PageHeader
        title="Patients"
        description={`${total} registered patient${total === 1 ? '' : 's'}. Medical records are never shown in the admin area.`}
      />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <PatientFilterBar q={searchParams.q} status={searchParams.status} />
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardContent>
            <EmptyState title="Failed to load patients" description={error.message} />
          </CardContent>
        </Card>
      ) : patients.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<Users className="h-8 w-8 text-secondary-400" />}
              title="No patients found"
              description="Try a different search or filter."
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
                    <th className="px-5 py-3 font-semibold">Patient</th>
                    <th className="px-5 py-3 font-semibold">Contact</th>
                    <th className="px-5 py-3 font-semibold">Registered</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {patients.map((patient) => (
                    <tr key={patient.id} className="transition-colors hover:bg-primary-50/30">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                            {(patient.full_name || patient.email || 'P')
                              .split(' ')
                              .map((p: string) => p[0])
                              .slice(0, 2)
                              .join('')}
                          </span>
                          <span className="font-semibold text-secondary-900">
                            {patient.full_name || 'Unnamed patient'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-secondary-700">{patient.email ?? '—'}</p>
                        <p className="text-xs text-secondary-400">{patient.phone ?? ''}</p>
                      </td>
                      <td className="px-5 py-3.5 text-secondary-500">{formatDate(patient.created_at)}</td>
                      <td className="px-5 py-3.5">
                        {patient.status === 'suspended' ? (
                          <Badge variant="danger">Suspended</Badge>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/admin/patients/${patient.id}`}
                          className="font-medium text-primary-600 hover:text-primary-700"
                        >
                          Manage
                        </Link>
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

function PatientFilterBar({ q, status }: { q?: string; status?: string }) {
  return (
    <form className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Input name="q" defaultValue={q ?? ''} placeholder="Search name, email or phone…" leftIcon={<Search className="h-4 w-4" />} />
      <Select name="status" defaultValue={status ?? ''}>
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
      </Select>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Apply
        </Button>
        {(q || status) && (
          <Link
            href="/admin/patients"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-secondary-300 text-secondary-500 transition-colors hover:bg-secondary-50"
            aria-label="Clear filters"
          >
            <X className="h-4 w-4" />
          </Link>
        )}
      </div>
    </form>
  )
}
