'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/user-context'

function LoadingState() {
  return (
    <div className="flex h-screen items-center justify-center bg-[var(--nd-bg)]">
      <p className="nd-label text-[var(--nd-text-disabled)]">[ Loading ]</p>
    </div>
  )
}

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isOnboarded, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace('/login')
      return
    }
    if (!isOnboarded) {
      router.replace('/onboarding')
    }
  }, [isAuthenticated, isOnboarded, isLoading, router])

  if (isLoading) return <LoadingState />
  if (!isAuthenticated || !isOnboarded) return <LoadingState />

  return <>{children}</>
}
