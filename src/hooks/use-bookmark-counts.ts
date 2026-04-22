'use client'

import { useQuery } from '@tanstack/react-query'
import type { BookmarkCounts } from '@/types/bookmark'

const EMPTY: BookmarkCounts = {
  total: 0,
  favorites: 0,
  archived: 0,
  trashed: 0,
  unsorted: 0,
  by_category: {},
  by_tag: {},
}

async function fetchCounts(): Promise<BookmarkCounts> {
  const res = await fetch('/api/bookmarks/counts')
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message ?? 'Failed to fetch counts')
  return json.data
}

export function useBookmarkCounts() {
  const query = useQuery({
    queryKey: ['bookmark-counts'],
    queryFn: fetchCounts,
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  })

  return {
    counts: query.data ?? EMPTY,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
