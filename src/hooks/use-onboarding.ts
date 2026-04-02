'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useUser } from '@/contexts/user-context'
import type { OnboardingStep } from '@/types/profile'

type OnboardingStepData = {
  username?: string
  display_name?: string
  selected_categories?: string[]
  first_bookmark_url?: string
}

export function useOnboarding() {
  const { profile, refetchProfile } = useUser()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentStep = (profile?.onboarding_step ?? 'username') as OnboardingStep

  const submitStep = useCallback(async (step: OnboardingStep, data: OnboardingStepData) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, data }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error?.message ?? 'Something went wrong')
        return false
      }
      await refetchProfile()
      return true
    } catch {
      toast.error('Network error. Please try again.')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [refetchProfile])

  const skipStep = useCallback(async () => {
    const nextMap: Record<OnboardingStep, OnboardingStep | 'done'> = {
      username: 'categories',
      categories: 'first_bookmark',
      first_bookmark: 'done',
      done: 'done',
    }
    const next = nextMap[currentStep]
    if (next === 'done') {
      await submitStep('first_bookmark', {})
      router.replace('/dashboard')
      return
    }
    await refetchProfile()
  }, [currentStep, submitStep, router, refetchProfile])

  const goBack = useCallback(() => {
    const prevMap: Partial<Record<OnboardingStep, OnboardingStep>> = {
      categories: 'username',
      first_bookmark: 'categories',
    }
    const prev = prevMap[currentStep]
    if (prev) refetchProfile()
  }, [currentStep, refetchProfile])

  return {
    currentStep,
    submitStep,
    skipStep,
    goBack,
    isSubmitting,
  }
}
