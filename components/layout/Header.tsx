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
import { Menu, X, User, LogOut, Settings, Stethoscope, Building2, Heart, HelpCircle, LayoutDashboard, Shield } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'

const navigation = [
  { name: 'Find Doctors', href: '/doctors', icon: Stethoscope },
  { name: 'Specialties', href: '/specialties', icon: Heart },
  { name: 'Hospitals', href: '/hospitals', icon: Building2 },
  { name: 'How It Works', href: '/how-it-works', icon: HelpCircle },
]

export function Header() {
  const pathname = usePathname()
  const { user, signOut, loading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
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
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2.5 group" aria-label="MediNear Home">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-teal-500 shadow-md group-hover:shadow-glow transition-all duration-300 group-hover:scale-105">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-teal-600 bg-clip-text text-transparent">
                MediNear
              </span>
            </Link>
          </div>

          <div className="hidden lg:flex lg:items-center lg:space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200',
                  pathname === item.href
                    ? 'bg-primary-100/80 text-primary-700 shadow-sm'
                    : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
                )}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex lg:items-center lg:space-x-3">
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="h-10 w-20 animate-pulse rounded-xl bg-secondary-200" />
                <div className="h-10 w-24 animate-pulse rounded-xl bg-secondary-200" />
              </div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-xl hover:bg-secondary-100 transition-all duration-200">
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
                      <Link href="/dashboard/admin" className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg">
                        <Shield className="h-4 w-4 text-primary-600" />
                        <span>Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={signOut}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="font-medium">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" className="font-medium bg-gradient-to-r from-primary-600 to-teal-600 hover:from-primary-700 hover:to-teal-700 shadow-md hover:shadow-glow transition-all duration-300">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="flex lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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
        mobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
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
                    ? 'bg-primary-100/80 text-primary-700'
                    : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
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
                <div className="px-4 py-2 mb-2">
                  <p className="text-sm font-semibold text-secondary-900">{user.full_name || 'User'}</p>
                  <p className="text-xs text-secondary-500 truncate">{user.email}</p>
                </div>
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
                    href="/dashboard/admin"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-secondary-600 hover:bg-secondary-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className="h-5 w-5" />
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={() => { signOut(); setMobileMenuOpen(false) }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-2 px-4 pt-2">
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full font-medium">Login</Button>
                </Link>
                <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full font-medium bg-gradient-to-r from-primary-600 to-teal-600">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
