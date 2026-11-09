'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Toaster, toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import {
  Activity,
  BarChart3,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeft,
  Settings,
  ShieldAlert,
  Stethoscope,
  Star,
  Users,
  UserRound,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type AdminProfile = {
  id: string
  full_name: string | null
  email: string | null
  avatar_url?: string | null
  role: string
}

const NAV_ITEMS: {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
}[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
  { href: '/admin/verification', label: 'Doctor Verification', icon: ShieldAlert },
  { href: '/admin/patients', label: 'Patients', icon: Users },
  { href: '/admin/hospitals', label: 'Hospitals & Clinics', icon: Building2 },
  { href: '/admin/appointments', label: 'Appointments', icon: CalendarDays },
  { href: '/admin/specialties', label: 'Specialties', icon: HeartPulse },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/analytics', label: 'Reports & Analytics', icon: BarChart3 },
  { href: '/admin/logs', label: 'Activity Logs', icon: ClipboardList },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminShell({
  profile,
  pendingVerifications = 0,
  children,
}: {
  profile: AdminProfile
  pendingVerifications?: number
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [profileOpen, setProfileOpen] = React.useState(false)
  const [signingOut, setSigningOut] = React.useState(false)

  React.useEffect(() => {
    setMobileOpen(false)
    setProfileOpen(false)
  }, [pathname])

  React.useEffect(() => {
    const stored = window.localStorage.getItem('admin-sidebar-collapsed')
    if (stored === '1') setCollapsed(true)
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      window.localStorage.setItem('admin-sidebar-collapsed', c ? '0' : '1')
      return !c
    })
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Signed out')
      router.push('/auth/login')
      router.refresh()
    } finally {
      setSigningOut(false)
    }
  }

  const initials = (profile.full_name || profile.email || 'A')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const nav = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href, item.exact)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-primary-50 text-primary-700 shadow-sm'
                : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900',
              collapsed && 'lg:justify-center lg:px-0'
            )}
            title={collapsed ? item.label : undefined}
          >
            <Icon
              className={cn(
                'h-5 w-5 shrink-0 transition-colors',
                active ? 'text-primary-600' : 'text-secondary-400 group-hover:text-secondary-600'
              )}
            />
            <span className={cn('truncate', collapsed && 'lg:hidden')}>{item.label}</span>
            {item.href === '/admin/verification' && pendingVerifications > 0 && (
              <span
                className={cn(
                  'ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-amber-700',
                  collapsed && 'lg:absolute lg:ml-0 lg:translate-x-2 lg:-translate-y-4'
                )}
              >
                {pendingVerifications}
              </span>
            )}
          </Link>
        )
      })}
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className={cn(
          'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-secondary-600 transition-colors',
          'hover:bg-red-50 hover:text-red-600 disabled:opacity-50',
          collapsed && 'lg:justify-center lg:px-0'
        )}
      >
        <LogOut className="h-5 w-5 shrink-0 text-secondary-400 group-hover:text-red-500" />
        <span className={cn(collapsed && 'lg:hidden')}>Logout</span>
      </button>
    </nav>
  )

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white">
      <div
        className={cn(
          'flex h-16 items-center gap-2.5 border-b border-secondary-100 px-5',
          collapsed && 'lg:justify-center lg:px-0'
        )}
      >
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-teal-500 shadow-glow">
            <HeartPulse className="h-5 w-5 text-white" />
          </span>
          <span className={cn('flex flex-col', collapsed && 'lg:hidden')}>
            <span className="text-base font-bold leading-tight text-secondary-900">MyDoctor</span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-primary-600">
              Admin
            </span>
          </span>
        </Link>
      </div>

      {nav}

      <div className={cn('border-t border-secondary-100 p-3', collapsed && 'lg:px-2')}>
        <Link
          href="/admin/settings"
          className={cn(
            'flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-secondary-50',
            collapsed && 'lg:justify-center'
          )}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </span>
          <span className={cn('min-w-0 flex-1', collapsed && 'lg:hidden')}>
            <span className="block truncate text-sm font-semibold text-secondary-900">
              {profile.full_name || 'Administrator'}
            </span>
            <span className="block truncate text-xs text-secondary-500">
              {profile.email || 'Admin'}
            </span>
          </span>
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-secondary-50">
      <Toaster position="top-right" richColors closeButton />

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed bottom-0 left-0 top-16 lg:top-28 z-30 hidden border-r border-secondary-200 bg-white transition-all duration-300 lg:block',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl">
            <button
              type="button"
              className="absolute right-3 top-3 rounded-lg p-1.5 text-secondary-500 hover:bg-secondary-100"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main column */}
      <div className={cn('transition-all duration-300', collapsed ? 'lg:pl-20' : 'lg:pl-64')}>
        <header className="sticky top-16 lg:top-28 z-20 flex h-16 items-center gap-3 border-b border-secondary-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className="hidden lg:inline-flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </Button>

          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden text-sm font-medium text-secondary-500 transition-colors hover:text-primary-600 sm:block"
            >
              View site
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-secondary-100"
                aria-expanded={profileOpen}
                aria-label="Admin menu"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                  {initials}
                </span>
                <span className="hidden text-left md:block">
                  <span className="block text-sm font-semibold leading-tight text-secondary-900">
                    {profile.full_name || 'Administrator'}
                  </span>
                  <span className="block text-[11px] leading-tight text-secondary-500">Admin</span>
                </span>
                <ChevronDown className="h-4 w-4 text-secondary-400" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-secondary-200 bg-white shadow-card">
                    <div className="border-b border-secondary-100 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-secondary-900">
                        {profile.full_name || 'Administrator'}
                      </p>
                      <p className="truncate text-xs text-secondary-500">{profile.email}</p>
                    </div>
                    <Link
                      href="/admin/settings"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-secondary-700 hover:bg-secondary-50"
                      onClick={() => setProfileOpen(false)}
                    >
                      <UserRound className="h-4 w-4" /> Profile & Settings
                    </Link>
                    <Link
                      href="/admin/logs"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-secondary-700 hover:bg-secondary-50"
                      onClick={() => setProfileOpen(false)}
                    >
                      <Activity className="h-4 w-4" /> Activity history
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="flex w-full items-center gap-2 border-t border-secondary-100 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
