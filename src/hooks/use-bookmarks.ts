'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  Bookmark,
  BookmarkFormData,
  BookmarkFilters,
  BookmarkListResponse,
  CreateBookmarkResponse,
  BulkActionType,
} from '@/types/bookmark'

// ─── API helpers ──────────────────────────────────────────────────────────────

function buildQuery(filters: BookmarkFilters): string {
  const params = new URLSearchParams()
  if (filters.query) params.set('query', filters.query)
  if (filters.category_id === null) params.set('category_id', 'null')
  else if (filters.category_id) params.set('category_id', filters.category_id)
  if (filters.is_pinned !== undefined) params.set('is_pinned', String(filters.is_pinned))
  if (filters.is_archived !== undefined) params.set('is_archived', String(filters.is_archived))
  if (filters.is_favorite !== undefined) params.set('is_favorite', String(filters.is_favorite))
  if (filters.is_trashed !== undefined) params.set('is_trashed', String(filters.is_trashed))
  if (filters.link_status) params.set('link_status', filters.link_status)
  if (filters.tags?.length) params.set('tags', filters.tags.join(','))
  if (filters.sort_by) params.set('sort_by', filters.sort_by)
  if (filters.sort_dir) params.set('sort_dir', filters.sort_dir)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.per_page) params.set('per_page', String(filters.per_page))
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

async function fetchBookmarks(filters: BookmarkFilters): Promise<BookmarkListResponse> {
  // Route to search endpoint when query present
  const endpoint = filters.query?.trim() ? '/api/search' : '/api/bookmarks'
  const res = await fetch(`${endpoint}${buildQuery(filters)}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message ?? 'Failed to fetch bookmarks')
  // /api/search returns { results, total, ... } — normalise to BookmarkListResponse shape
  if (filters.query?.trim()) {
    return { bookmarks: json.data.results, total: json.data.total, has_next: json.data.has_next }
  }
  return json.data
}

async function createBookmark(data: BookmarkFormData): Promise<CreateBookmarkResponse> {
  const res = await fetch('/api/bookmarks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message ?? 'Failed to create bookmark')
  return json.data
}

async function updateBookmark(id: string, data: Partial<BookmarkFormData>): Promise<Bookmark> {
  const res = await fetch(`/api/bookmarks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message ?? 'Failed to update bookmark')
  return json.data
}

async function deleteBookmark(id: string, hard = false): Promise<void> {
  const url = hard ? `/api/bookmarks/${id}?hard=true` : `/api/bookmarks/${id}`
  const res = await fetch(url, { method: 'DELETE' })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message ?? 'Failed to delete bookmark')
}

async function bulkAction(ids: string[], action: BulkActionType): Promise<{ affected: number }> {
  const res = await fetch('/api/bookmarks/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, action }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message ?? 'Bulk action failed')
  return json.data
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: BookmarkFilters = {
  is_archived: false,
  sort_by: 'created_at',
  sort_dir: 'desc',
  page: 1,
  per_page: 20,
}

export function useBookmarks(initialFilters: BookmarkFilters = {}) {
  const queryClient = useQueryClient()
  const [filters, setFiltersState] = useState<BookmarkFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  })

  const queryKey = ['bookmarks', filters]

  const query = useQuery({
    queryKey,
    queryFn: () => fetchBookmarks(filters),
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  })

  const setFilters = useCallback((update: Partial<BookmarkFilters>) => {
    setFiltersState(prev => ({ ...prev, ...update, page: 1 }))
  }, [])

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS)
  }, [])

  const setPage = useCallback((page: number) => {
    setFiltersState(prev => ({ ...prev, page }))
  }, [])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    queryClient.invalidateQueries({ queryKey: ['bookmark-counts'] })
  }

  const addBookmark = useMutation({
    mutationFn: (data: BookmarkFormData) => createBookmark(data),
    onSuccess: () => invalidate(),
  })

  const editBookmark = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BookmarkFormData> }) =>
      updateBookmark(id, data),
    onSuccess: () => invalidate(),
  })

  const removeBookmark = useMutation({
    mutationFn: ({ id, hard }: { id: string; hard?: boolean }) => deleteBookmark(id, hard),
    onSuccess: () => invalidate(),
  })

  const bulkMutation = useMutation({
    mutationFn: ({ ids, action }: { ids: string[]; action: BulkActionType }) =>
      bulkAction(ids, action),
    onSuccess: () => invalidate(),
  })

  return {
    bookmarks: query.data?.bookmarks ?? [],
    total: query.data?.total ?? 0,
    hasNextPage: query.data?.has_next ?? false,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    filters,
    page: filters.page ?? 1,
    setFilters,
    resetFilters,
    setPage,
    addBookmark: (data: BookmarkFormData) => addBookmark.mutateAsync(data),
    updateBookmark: (id: string, data: Partial<BookmarkFormData>) =>
      editBookmark.mutateAsync({ id, data }),
    deleteBookmark: (id: string) => removeBookmark.mutateAsync({ id }),
    permanentDelete: (id: string) => removeBookmark.mutateAsync({ id, hard: true }),
    bulkAction: (ids: string[], action: BulkActionType) =>
      bulkMutation.mutateAsync({ ids, action }),
    isAdding: addBookmark.isPending,
    isUpdating: editBookmark.isPending,
    isDeleting: removeBookmark.isPending,
    isBulking: bulkMutation.isPending,
  }
}
