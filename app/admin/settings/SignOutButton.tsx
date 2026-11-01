'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LogOut } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'

export function SignOutButton() {
  const router = useRouter()
  const [busy, setBusy] = React.useState(false)

  const handleSignOut = async () => {
    setBusy(true)
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
      setBusy(false)
    }
  }

  return (
    <Button variant="outline" className="w-full text-red-600 hover:bg-red-50" onClick={handleSignOut} loading={busy}>
      <LogOut className="mr-2 h-4 w-4" /> Sign out
    </Button>
  )
}
