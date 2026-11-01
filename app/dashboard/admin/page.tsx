import { redirect } from 'next/navigation'

/**
 * Legacy admin dashboard route. The full admin dashboard now lives at /admin.
 */
export default function LegacyAdminDashboardPage() {
  redirect('/admin')
}
