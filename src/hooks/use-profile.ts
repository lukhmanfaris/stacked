'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@/contexts/user-context'
import type { UserPreferences } from '@/types/profile'

interface ProfileUpdateData {
  username?: string
  display_name?: string
  bio?: string
}

// ─── Fetch helpers ─────────────────────────────────────────────────────────────

async function patchProfile(data: ProfileUpdateData) {
  const res = await fetch('/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message ?? 'Failed to update profile')
  return json.data.profile
}

async function patchPreferences(data: Partial<UserPreferences>) {
  const res = await fetch('/api/preferences', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message ?? 'Failed to update preferences')
  return json.data.preferences
}

async function deleteAccount() {
  const res = await fetch('/api/profile', { method: 'DELETE' })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message ?? 'Failed to delete account')
  return json.data
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useProfile() {
  const { refetchProfile } = useUser()
  const queryClient = useQueryClient()

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileUpdateData) => patchProfile(data),
    onSuccess: () => refetchProfile(),
  })

  const updatePreferencesMutation = useMutation({
    mutationFn: (data: Partial<UserPreferences>) => patchPreferences(data),
    onSuccess: () => refetchProfile(),
  })

  const deleteAccountMutation = useMutation({
    mutationFn: deleteAccount,
  })

  return {
    updateProfile: (data: ProfileUpdateData) => updateProfileMutation.mutateAsync(data),
    updatePreferences: (data: Partial<UserPreferences>) => updatePreferencesMutation.mutateAsync(data),
    deleteAccount: () => deleteAccountMutation.mutateAsync(),
    isUpdatingProfile: updateProfileMutation.isPending,
    isUpdatingPreferences: updatePreferencesMutation.isPending,
    isDeletingAccount: deleteAccountMutation.isPending,
  }
}
