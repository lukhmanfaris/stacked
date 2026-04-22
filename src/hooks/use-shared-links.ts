'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { SharedLink, SharedLinkFormData } from '@/types/shared-link'

async function fetchSharedLinks(): Promise<SharedLink[]> {
  const res = await fetch('/api/shared-links')
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message ?? 'Failed to fetch shared links')
  return json.data
}

async function createSharedLink(data: SharedLinkFormData): Promise<SharedLink> {
  const res = await fetch('/api/shared-links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message ?? 'Failed to create shared link')
  return json.data
}

async function updateSharedLink(id: string, data: Partial<SharedLinkFormData>): Promise<SharedLink> {
  const res = await fetch(`/api/shared-links/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message ?? 'Failed to update shared link')
  return json.data
}

async function deleteSharedLink(id: string): Promise<void> {
  const res = await fetch(`/api/shared-links/${id}`, { method: 'DELETE' })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message ?? 'Failed to delete shared link')
}

export function useSharedLinks() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['shared-links'],
    queryFn: fetchSharedLinks,
    staleTime: 1000 * 60,
  })

  const addLink = useMutation({
    mutationFn: (data: SharedLinkFormData) => createSharedLink(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shared-links'] }),
  })

  const editLink = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SharedLinkFormData> }) =>
      updateSharedLink(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shared-links'] }),
  })

  const removeLink = useMutation({
    mutationFn: (id: string) => deleteSharedLink(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shared-links'] }),
  })

  return {
    links: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createLink: (data: SharedLinkFormData) => addLink.mutateAsync(data),
    updateLink: (id: string, data: Partial<SharedLinkFormData>) =>
      editLink.mutateAsync({ id, data }),
    deleteLink: (id: string) => removeLink.mutateAsync(id),
    isCreating: addLink.isPending,
    isUpdating: editLink.isPending,
    isDeleting: removeLink.isPending,
  }
}
