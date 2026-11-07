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
import { Menu, X, User, LogOut, Settings, Stethoscope, Building2, Heart, HelpCircle, LayoutDashboard, Shield, Home, Calendar, Siren } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Find Doctors', href: '/doctors', icon: Stethoscope },
  { name: 'Specialties', href: '/specialties', icon: Heart },
  { name: 'Hospitals & Clinics', href: '/hospitals', icon: Building2 },
  { name: 'How It Works', href: '/how-it-works', icon: HelpCircle },
  { name: 'Emergency', href: '/emergency', icon: Siren, emergency: true },
]

export function Header() {
  const pathname = usePathname()
  const { user, signOut, loading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  const [signOutError, setSignOutError] = React.useState('')

  // Keeps the menu open when signing out fails so the message is readable.
  const handleSignOut = React.useCallback(
    async (onSuccess?: () => void) => {
      setSignOutError('')
      const { error } = await signOut()
      if (error) {
        console.error('Error signing out:', error)
        setSignOutError('We could not sign you out. Please try again.')
        return
      }
      onSuccess?.()
    },
    [signOut]
  )

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={cn(
      'sticky top-0 z-50 w-full transition-all duration-300',
      scrolled 
        ? 'bg-white/90 backdrop-blur-xl border-b border-secondary-200/50 shadow-soft' 
        : 'bg-white/80 backdrop-blur-sm border-b border-secondary-200/30'
    )}>
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center shrink-0">
            <Link href="/" className="flex items-center space-x-2.5 group" aria-label="MyDoctor Home">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-teal-500 shadow-md group-hover:shadow-glow transition-all duration-300 group-hover:scale-105">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-teal-600 bg-clip-text text-transparent">
                MyDoctor
              </span>
            </Link>
          </div>

          <div className="hidden lg:flex lg:min-w-0 lg:items-center lg:space-x-1 lg:overflow-x-auto lg:scrollbar-hide">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200',
                  pathname === item.href
                    ? item.emergency
                      ? 'bg-red-50 text-red-700 shadow-sm'
                      : 'bg-primary-100/80 text-primary-700 shadow-sm'
                    : item.emergency
                      ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
                      : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
                )}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex lg:shrink-0 lg:items-center lg:space-x-3">
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="h-10 w-20 animate-pulse rounded-xl bg-secondary-200" />
                <div className="h-10 w-24 animate-pulse rounded-xl bg-secondary-200" />
              </div>
            ) : user ? (
              <div className="flex items-center gap-2">
                <Link href="/account">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 font-medium border-primary-200 text-primary-700 hover:bg-primary-50"
                  >
                    <User className="h-4 w-4" aria-hidden="true" />
                    Account
                  </Button>
                </Link>
                <Link href="/doctors">
                  <Button
                    size="sm"
                    className="gap-1.5 font-medium bg-gradient-to-r from-primary-600 to-teal-600 hover:from-primary-700 hover:to-teal-700 shadow-md transition-all duration-300"
                  >
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                    Book Appointment
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-xl hover:bg-secondary-100 transition-all duration-200"
                      onClick={() => setSignOutError('')}
                    >
                      <Avatar 
                        src={user.avatar_url} 
                        fallback={user.full_name || user.email} 
                        size="sm" 
                        alt={user.full_name || 'User'}
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 p-2">
                    <div className="px-3 py-2 mb-1">
                      <p className="text-sm font-semibold text-secondary-900">{user.full_name || 'User'}</p>
                      <p className="text-xs text-secondary-500 truncate">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    {user.role === 'doctor' && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/doctor" className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg">
                          <LayoutDashboard className="h-4 w-4 text-primary-600" />
                          <span>Doctor Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user.role === 'patient' && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/patient" className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg">
                          <LayoutDashboard className="h-4 w-4 text-primary-600" />
                          <span>Patient Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg">
                          <Shield className="h-4 w-4 text-primary-600" />
                          <span>Admin Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {signOutError && (
                      <p role="alert" className="px-3 py-2 text-xs font-medium text-red-600">
                        {signOutError}
                      </p>
                    )}
                    <DropdownMenuItem 
                      onSelect={(event) => {
                        event.preventDefault()
                        void handleSignOut()
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="font-medium">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button
                    size="sm"
                    variant="outline"
                    className="font-medium border-primary-200 text-primary-700 hover:bg-primary-50"
                  >
                    Sign Up
                  </Button>
                </Link>
                <Link href="/doctors">
                  <Button size="sm" className="gap-1.5 font-medium bg-gradient-to-r from-primary-600 to-teal-600 hover:from-primary-700 hover:to-teal-700 shadow-md hover:shadow-glow transition-all duration-300">
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                    Book Appointment
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="flex lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSignOutError('')
                setMobileMenuOpen(!mobileMenuOpen)
              }}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              className="rounded-xl"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={cn(
        'lg:hidden overflow-hidden transition-all duration-300',
        mobileMenuOpen ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0'
      )}>
        <div className="border-t border-secondary-200/50 bg-white/95 backdrop-blur-xl py-4">
          <div className="space-y-1 px-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-all duration-200',
                  pathname === item.href
                    ? item.emergency
                      ? 'bg-red-50 text-red-700'
                      : 'bg-primary-100/80 text-primary-700'
                    : item.emergency
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                {item.name}
              </Link>
            ))}
            <Link
              href="/doctors"
              className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary-600 to-teal-600 px-4 py-3 text-base font-semibold text-white shadow-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Calendar className="h-5 w-5" aria-hidden="true" />
              Book Appointment
            </Link>
            <Separator className="my-4" />
            {loading ? (
              <div className="space-y-3 px-4" aria-hidden="true">
                <div className="h-10 w-full animate-pulse rounded-xl bg-secondary-200" />
                <div className="h-10 w-full animate-pulse rounded-xl bg-secondary-200" />
              </div>
            ) : user ? (
              <>
                <div className="px-4 py-2 mb-2">
                  <p className="text-sm font-semibold text-secondary-900">{user.full_name || 'User'}</p>
                  <p className="text-xs text-secondary-500 truncate">{user.email}</p>
                </div>
                <Link
                  href="/account"
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-secondary-900 hover:bg-secondary-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-5 w-5 text-primary-600" />
                  Account
                </Link>
                {user.role === 'doctor' && (
                  <Link
                    href="/dashboard/doctor"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-secondary-600 hover:bg-secondary-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Doctor Dashboard
                  </Link>
                )}
                {user.role === 'patient' && (
                  <Link
                    href="/dashboard/patient"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-secondary-600 hover:bg-secondary-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Patient Dashboard
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-secondary-600 hover:bg-secondary-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className="h-5 w-5" />
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={() => void handleSignOut(() => setMobileMenuOpen(false))}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
                {signOutError && (
                  <p role="alert" className="px-4 pb-1 text-xs font-medium text-red-600">
                    {signOutError}
                  </p>
                )}
              </>
            ) : (
              <div className="flex flex-col space-y-2 px-4 pt-2">
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full font-medium">Sign In</Button>
                </Link>
                <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full font-medium bg-gradient-to-r from-primary-600 to-teal-600">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
