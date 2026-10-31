'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode, useCallback } from 'react'
import { Session, SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'
import { User } from '@/lib/types'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: 'patient' | 'doctor',
    phone?: string
  ) => Promise<{ error: Error | null; session: Session | null; profileError: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null; session: Session | null }>
  signOut: () => Promise<{ error: Error | null }>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function userFromSession(activeSession: Session): User {
  const authUser = activeSession.user
  const metadata = (authUser.user_metadata ?? {}) as Record<string, unknown>

  return {
    id: authUser.id,
    email: authUser.email ?? '',
    phone:
      typeof metadata.phone === 'string' && metadata.phone
        ? metadata.phone
        : authUser.phone ?? undefined,
    full_name:
      typeof metadata.full_name === 'string' && metadata.full_name
        ? metadata.full_name
        : undefined,
    avatar_url:
      typeof metadata.avatar_url === 'string' && metadata.avatar_url
        ? metadata.avatar_url
        : undefined,
    role: metadata.role === 'doctor' ? 'doctor' : 'patient',
    created_at: authUser.created_at ?? '',
    updated_at: authUser.updated_at ?? authUser.created_at ?? '',
  }
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // One browser client for the whole app lifetime (instead of one per render).
  const supabaseRef = useRef<SupabaseClient | null>(null)
  if (!supabaseRef.current) {
    supabaseRef.current = createClient()
  }
  const supabase = supabaseRef.current

  // Guards against the duplicate profile fetch that previously happened on
  // every page load (onAuthStateChange + getSession both fired a query).
  const loadedUserRef = useRef<string | null>(null)

  const fetchProfile = useCallback(async (activeSession: Session, force = false) => {
    const userId = activeSession.user.id
    if (!force && loadedUserRef.current === userId) return
    loadedUserRef.current = userId

    const fallbackUser = userFromSession(activeSession)
    let nextUser: User = fallbackUser
    let profileLoaded = false

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching user:', error)
      } else if (!data) {
        loadedUserRef.current = null
      } else {
        profileLoaded = true
        nextUser = {
          ...fallbackUser,
          ...data,
          email: fallbackUser.email,
          full_name: data.full_name || fallbackUser.full_name,
          phone: data.phone || fallbackUser.phone,
          avatar_url: data.avatar_url || fallbackUser.avatar_url,
          role: (data.role || fallbackUser.role) as User['role'],
          updated_at: data.updated_at || data.created_at || fallbackUser.updated_at,
        }
      }
    } catch (error) {
      // Network failure or unexpected runtime error: keep the session-based
      // user so the UI stays usable, and allow a later retry to fetch again.
      console.error('Error fetching user:', error)
    }

    if (!profileLoaded) loadedUserRef.current = null
    setUser(nextUser)
  }, [supabase])

  const ensureProfile = useCallback(async (activeSession: Session): Promise<Error | null> => {
    const authUser = activeSession.user
    const metadata = (authUser.user_metadata ?? {}) as Record<string, unknown>
    const fullName =
      typeof metadata.full_name === 'string' && metadata.full_name.trim().length > 0
        ? metadata.full_name.trim()
        : null
    const phone =
      typeof metadata.phone === 'string' && metadata.phone.trim().length > 0
        ? metadata.phone.trim()
        : null

    const { data: profile, error: readError } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', authUser.id)
      .maybeSingle()

    if (readError) return readError

    if (!profile) {
      const { error: insertError } = await supabase.from('profiles').insert({
        id: authUser.id,
        full_name: fullName,
        phone,
        role: 'patient',
      })
      return insertError
    }

    const patch: Record<string, string | null> = {}
    if (!profile.full_name && fullName) patch.full_name = fullName
    if (!profile.phone && phone) patch.phone = phone

    if (Object.keys(patch).length === 0) return null

    const { error: updateError } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', authUser.id)
    return updateError
  }, [supabase])

  const refreshUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await fetchProfile(session, true)
      } else {
        loadedUserRef.current = null
        setUser(null)
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }, [supabase, fetchProfile])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, nextSession: Session | null) => {
      try {
        setSession(nextSession)
        if (nextSession?.user) {
          setUser((previous) =>
            previous && previous.id === nextSession.user.id ? previous : userFromSession(nextSession)
          )
          await fetchProfile(nextSession)
        } else {
          loadedUserRef.current = null
          setUser(null)
        }
      } catch (error) {
        console.error('Error handling auth state change:', error)
        if (nextSession?.user) {
          loadedUserRef.current = null
          setUser(userFromSession(nextSession))
        }
      } finally {
        // Always leave the loading state, even if the request failed.
        setLoading(false)
      }
    })

    // Fallback for initial load; deduped with the INITIAL_SESSION handler above.
    supabase.auth
      .getSession()
      .then(({ data }: { data: { session: Session | null } }) => {
        if (data.session?.user) {
          return fetchProfile(data.session)
        }
        return undefined
      })
      .catch((error) => {
        console.error('Error reading auth session:', error)
      })
      .finally(() => {
        setLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [supabase, fetchProfile])

  const signUp = useCallback(async (
    email: string,
    password: string,
    fullName: string,
    role: 'patient' | 'doctor',
    phone?: string
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone ?? null,
            role,
          },
        },
      })

      if (error) return { error, session: null, profileError: null }

      const session = data.session
      if (!session) {
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          return {
            error: new Error('An account with this email already exists. Please sign in instead.'),
            session: null,
            profileError: null,
          }
        }
        return { error: null, session: null, profileError: null }
      }

      const profileError = await ensureProfile(session)
      if (profileError) console.error('Error saving profile:', profileError)

      await fetchProfile(session, true)

      return { error: null, session, profileError }
    } catch (error) {
      console.error('Error signing up:', error)
      return {
        error: new Error('We could not create your account right now. Please check your connection and try again.'),
        session: null,
        profileError: null,
      }
    }
  }, [supabase, ensureProfile, fetchProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) return { error, session: null }

      const session = data.session
      if (session) {
        const profileError = await ensureProfile(session)
        if (profileError) console.error('Error saving profile:', profileError)
        await fetchProfile(session, true)
      }

      return { error: null, session }
    } catch (error) {
      console.error('Error signing in:', error)
      return {
        error: new Error('We could not sign you in right now. Please check your connection and try again.'),
        session: null,
      }
    }
  }, [supabase, ensureProfile, fetchProfile])

  const signOut = useCallback(async (): Promise<{ error: Error | null }> => {
    try {
      const { error: signOutError } = await supabase.auth.signOut()
      const { data: { session: remainingSession } } = await supabase.auth.getSession()

      if (!remainingSession) {
        loadedUserRef.current = null
        setUser(null)
        setSession(null)
        return { error: null }
      }

      return {
        error: signOutError ?? new Error('Sign out failed. Please try again.'),
      }
    } catch (error) {
      console.error('Error signing out:', error)
      return {
        error: error instanceof Error ? error : new Error('Sign out failed. Please try again.'),
      }
    }
  }, [supabase])


  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })
      return { error }
    } catch (error) {
      console.error('Error requesting password reset:', error)
      return {
        error: new Error('We could not send the reset email right now. Please check your connection and try again.'),
      }
    }
  }, [supabase])

  const contextValue = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshUser,
  }), [user, session, loading, signUp, signIn, signOut, resetPassword, refreshUser])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
