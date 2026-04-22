'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useUser } from '@/contexts/user-context'
import type { UserTier } from '@/types/profile'

export function useAuth() {
  const { user, profile, isLoading, isAuthenticated, isOnboarded } = useUser()
  const router = useRouter()

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }, [router])

  return {
    user,
    profile,
    isLoading,
    isAuthenticated,
    isOnboarded,
    signOut,
    tier: (profile?.tier ?? 'free') as UserTier,
  }
}
