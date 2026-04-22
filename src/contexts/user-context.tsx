'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import type { Profile } from '@/types/profile'

interface UserContextValue {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  isOnboarded: boolean
  refetchProfile: () => Promise<void>
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Stable reference — singleton client, not recreated on each render
  const [supabaseClient] = useState(() => supabase)

  const fetchProfile = async (userId: string) => {
    const { data } = await (supabaseClient as any)
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return data as Profile | null
  }

  const refetchProfile = async () => {
    if (user) {
      const data = await fetchProfile(user.id)
      setProfile(data)
    }
  }

  useEffect(() => {
    // `cancelled` prevents state updates from a stale effect closure.
    // React Strict Mode double-mounts: first effect is cleaned up before the
    // second runs. Without this flag, the first effect's async callbacks can
    // still resolve and call setState after the component has re-mounted,
    // causing two concurrent auth initializations that compete for the
    // Web Locks API auth-token lock.
    let cancelled = false

    // Phase 1: Immediate init via getSession() — reads from cookie/localStorage
    // cache without a network request and without acquiring the auth lock.
    // This unblocks the AuthGuard quickly so the page renders rather than
    // staying on the loading spinner if INITIAL_SESSION is delayed.
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (cancelled) return
      // Stale/invalid refresh token — clear it silently so user can re-authenticate
      if (error || !session) {
        if (error) await supabase.auth.signOut().catch(() => {})
        setUser(null)
        setProfile(null)
        if (!cancelled) setIsLoading(false)
        return
      }
      setUser(session.user)
      const data = await fetchProfile(session.user.id)
      if (!cancelled) setProfile(data)
      if (!cancelled) setIsLoading(false)
    })

    // Phase 2: Subscribe to real-time auth state changes (sign-in, sign-out,
    // token refresh). onAuthStateChange fires INITIAL_SESSION once the SDK
    // has validated the session with the server. We DON'T set isLoading from
    // INITIAL_SESSION here because Phase 1 already handled that — avoiding a
    // second lock acquisition for the same initialization.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return

        // Only update state on meaningful transitions, not the initial load
        // (which is already handled by getSession above).
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session?.user ?? null)
          if (session?.user) {
            const data = await fetchProfile(session.user.id)
            if (!cancelled) setProfile(data)
          }
        }

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
        }

        // Ensure isLoading is cleared for the INITIAL_SESSION path as well,
        // in case getSession() returned null but the server session is valid.
        if (event === 'INITIAL_SESSION' && !cancelled) {
          setUser(session?.user ?? null)
          if (session?.user && !profile) {
            const data = await fetchProfile(session.user.id)
            if (!cancelled) setProfile(data)
          }
          if (!cancelled) setIsLoading(false)
        }
      }
    )

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <UserContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated: !!user,
        isOnboarded: profile?.onboarding_step === 'done',
        refetchProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
