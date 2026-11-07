'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/hooks/useAuth'
import { DoctorCompareProvider } from '@/lib/hooks/useDoctorCompare'
import { CompareBar } from '@/components/doctors/CompareBar'

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // The admin shell renders its own Toaster — avoid mounting a second one.
  const isAdminSurface = Boolean(pathname && (pathname === '/admin' || pathname.startsWith('/admin/')))

  return (
    <AuthProvider>
      <DoctorCompareProvider>
        {children}
        <CompareBar />
        {!isAdminSurface && (
          <Toaster position="top-center" richColors closeButton />
        )}
      </DoctorCompareProvider>
    </AuthProvider>
  )
}
