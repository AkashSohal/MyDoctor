'use client'

import * as React from 'react'
import { AuthProvider } from '@/lib/hooks/useAuth'

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}