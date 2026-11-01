import * as React from 'react'
import { requireAdmin } from '@/lib/admin/auth'
import { formatDateTime } from '@/lib/admin/format'
import { SettingsProfileForm } from './SettingsProfileForm'
import { PasswordForm } from './PasswordForm'
import { SignOutButton } from './SignOutButton'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const { supabase, userId, profile } = await requireAdmin()

  const [{ data: row }, { data: activity }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, phone, status, created_at, last_login_at')
      .eq('id', userId)
      .single(),
    supabase
      .from('admin_audit_logs')
      .select('id, action, entity_type, reason, created_at')
      .eq('admin_id', userId)
      .order('created_at', { ascending: false })
      .limit(15),
  ])

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your administrator profile, password and security."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <SettingsProfileForm
              profile={{
                full_name: row?.full_name ?? '',
                phone: row?.phone ?? '',
                email: row?.email ?? profile.email ?? '',
              }}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change password</CardTitle>
            </CardHeader>
            <CardContent>
              <PasswordForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-secondary-600">Role</span>
                <Badge variant="success">Administrator</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary-600">Account status</span>
                <Badge variant={row?.status === 'suspended' ? 'danger' : 'success'}>
                  {row?.status === 'suspended' ? 'Suspended' : 'Active'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary-600">Member since</span>
                <span className="text-secondary-800">
                  {row?.created_at ? formatDateTime(row.created_at) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary-600">Last sign-in</span>
                <span className="text-secondary-800">
                  {row?.last_login_at ? formatDateTime(row.last_login_at) : '—'}
                </span>
              </div>
              <p className="flex items-start gap-2 rounded-xl bg-primary-50 p-3 text-xs text-primary-800">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                Your admin role is stored in the database profiles table and verified on every
                server request. It cannot be changed from this screen.
              </p>
              <div className="pt-2">
                <SignOutButton />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Your recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activity && activity.length > 0 ? (
            <ul className="divide-y divide-secondary-50">
              {activity.map((log: any) => (
                <li key={log.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-secondary-800">
                      {log.action
                        .split('_')
                        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ')}
                    </p>
                    <p className="text-xs text-secondary-400">
                      {log.entity_type}
                      {log.reason ? ` · ${log.reason}` : ''}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-secondary-400">
                    {formatDateTime(log.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-4 text-sm text-secondary-500">No administrative actions recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
