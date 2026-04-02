'use client'

import { useState, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LIMITS } from '@/lib/constants'
import type { SearchResponse, SearchFilters } from '@/types/search'

const RECENT_SEARCHES_KEY = 'stacked:recent-searches'
const MAX_RECENT = 5

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveRecentSearch(query: string) {
  if (!query.trim()) return
  const existing = getRecentSearches().filter(q => q !== query)
  const updated = [query, ...existing].slice(0, MAX_RECENT)
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
}

function buildQueryString(query: string, filters: SearchFilters): string {
  const params = new URLSearchParams({ query })
  if (filters.category_id)             params.set('category_id', filters.category_id)
  if (filters.tags?.length)             params.set('tags', filters.tags.join(','))
  if (filters.link_status)              params.set('link_status', filters.link_status)
  if (filters.is_pinned !== undefined)  params.set('is_pinned', String(filters.is_pinned))
  if (filters.is_archived !== undefined) params.set('is_archived', String(filters.is_archived))
  if (filters.date_from)                params.set('date_from', filters.date_from)
  if (filters.date_to)                  params.set('date_to', filters.date_to)
  if (filters.sort_by)                  params.set('sort_by', filters.sort_by)
  if (filters.sort_dir)                 params.set('sort_dir', filters.sort_dir)
  if (filters.page)                     params.set('page', String(filters.page))
  if (filters.per_page)                 params.set('per_page', String(filters.per_page))
  return params.toString()
}

async function fetchSearch(query: string, filters: SearchFilters): Promise<SearchResponse> {
  const qs = buildQueryString(query, filters)
  const res = await fetch(`/api/search?${qs}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message ?? 'Search failed')
  return json.data
}

function hasActiveFilters(filters: SearchFilters): boolean {
  return !!(
    filters.category_id ||
    filters.tags?.length ||
    filters.link_status ||
    filters.is_pinned !== undefined ||
    filters.date_from ||
    filters.date_to
  )
}

const DEFAULT_FILTERS: SearchFilters = {
  sort_by: 'created_at',
  sort_dir: 'desc',
  page: 1,
  per_page: 20,
}

export function useSearch() {
  const [query, setQueryRaw] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [filters, setFiltersState] = useState<SearchFilters>(DEFAULT_FILTERS)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    setRecentSearches(getRecentSearches())
  }, [])

  // Debounce query input
  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedQuery(query),
      LIMITS.SEARCH_DEBOUNCE_MS,
    )
    return () => clearTimeout(t)
  }, [query])

  // Persist non-empty queries to recent searches
  useEffect(() => {
    if (debouncedQuery.trim()) {
      saveRecentSearch(debouncedQuery.trim())
      setRecentSearches(getRecentSearches())
    }
  }, [debouncedQuery])

  const isActive = debouncedQuery.trim().length > 0 || hasActiveFilters(filters)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', debouncedQuery, filters],
    queryFn: () => fetchSearch(debouncedQuery, filters),
    enabled: isActive,
    staleTime: 1000 * 30,
    placeholderData: prev => prev,
  })

  const setQuery = useCallback((q: string) => {
    setQueryRaw(q)
    setFiltersState(prev => ({ ...prev, page: 1 }))
  }, [])

  const setFilters = useCallback((update: Partial<SearchFilters>) => {
    setFiltersState(prev => ({ ...prev, ...update, page: 1 }))
  }, [])

  const setPage = useCallback((page: number) => {
    setFiltersState(prev => ({ ...prev, page }))
  }, [])

  const clearSearch = useCallback(() => {
    setQueryRaw('')
    setDebouncedQuery('')
    setFiltersState(DEFAULT_FILTERS)
  }, [])

  return {
    query,
    setQuery,
    debouncedQuery,
    filters,
    setFilters,
    setPage,
    clearSearch,
    results: data?.results ?? [],
    total: data?.total ?? 0,
    hasNextPage: data?.has_next ?? false,
    page: filters.page ?? 1,
    isSearching: isLoading || isFetching,
    isActive,
    recentSearches,
  }
}
