'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
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
  // Stable reference — createClient() called once, not recreated on every render
  const [supabase] = useState(() => createClient())

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data as Profile | null)
  }

  const refetchProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  useEffect(() => {
    // onAuthStateChange fires immediately with INITIAL_SESSION — no Web Lock acquired.
    // Replaces the separate getUser() init() call which orphaned the lock under
    // React Strict Mode double-mount (component unmounts before getUser resolves).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        if (event === 'INITIAL_SESSION') {
          setIsLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
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
