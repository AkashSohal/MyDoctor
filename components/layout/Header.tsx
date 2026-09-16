'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown'
import { Avatar } from '@/components/ui/avatar'
import { Menu, X, User, LogOut, Settings, Stethoscope, Building2, Heart, HelpCircle, LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'

const navigation = [
  { name: 'Find Doctors', href: '/doctors', icon: Stethoscope },
  { name: 'Specialties', href: '/specialties', icon: Heart },
  { name: 'Hospitals', href: '/hospitals', icon: Building2 },
  { name: 'How It Works', href: '/how-it-works', icon: HelpCircle },
  { name: 'About', href: '/about', icon: HelpCircle },
]

export function Header() {
  const pathname = usePathname()
  const { user, signOut, loading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-secondary-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2" aria-label="MediNear Home">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-600">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-secondary-900">MediNear</span>
            </Link>
          </div>

          <div className="hidden md:flex md:items-center md:space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                )}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex md:items-center md:space-x-3">
            {loading ? (
              <div className="h-10 w-20 animate-pulse rounded-xl bg-secondary-200" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-xl">
                    <Avatar 
                      src={user.avatar_url} 
                      fallback={user.full_name || user.email} 
                      size="sm" 
                      alt={user.full_name || 'User'}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1">
                    <p className="text-sm font-medium text-secondary-900">{user.full_name || 'User'}</p>
                    <p className="text-xs text-secondary-500 truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {user.role === 'doctor' && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/doctor" className="flex w-full items-center">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Doctor Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === 'patient' && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/patient" className="flex w-full items-center">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Patient Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/admin" className="flex w-full items-center">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex w-full items-center pointer-events-none opacity-50">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings (Coming Soon)
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={signOut}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Register</Button>
                </Link>
              </div>
            )}
          </div>

          <div className="flex md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-secondary-200 bg-white py-4">
          <div className="space-y-1 px-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                {item.name}
              </Link>
            ))}
            <Separator className="my-4" />
            {user ? (
              <>
                {user.role === 'doctor' && (
                  <Link
                    href="/dashboard/doctor"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-medium text-secondary-600 hover:bg-secondary-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Doctor Dashboard
                  </Link>
                )}
                {user.role === 'patient' && (
                  <Link
                    href="/dashboard/patient"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-medium text-secondary-600 hover:bg-secondary-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Patient Dashboard
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link
                    href="/dashboard/admin"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-medium text-secondary-600 hover:bg-secondary-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={signOut}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-base font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-2 px-3 pt-2">
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Login</Button>
                </Link>
                <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Register</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}