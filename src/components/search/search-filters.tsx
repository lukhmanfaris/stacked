'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, X, SlidersHorizontal } from 'lucide-react'
import { useCategories } from '@/hooks/use-categories'
import { cn } from '@/lib/utils'
import type { SearchFilters } from '@/types/search'
import type { LinkStatus } from '@/types/bookmark'

const LINK_STATUS_OPTIONS: { value: LinkStatus; label: string }[] = [
  { value: 'alive',      label: 'Alive' },
  { value: 'dead',       label: 'Dead' },
  { value: 'redirected', label: 'Redirected' },
  { value: 'timeout',    label: 'Timeout' },
  { value: 'unchecked',  label: 'Unchecked' },
]

interface SearchFiltersProps {
  filters: SearchFilters
  onFiltersChange: (update: Partial<SearchFilters>) => void
  className?: string
}

export function SearchFilters({ filters, onFiltersChange, className }: SearchFiltersProps) {
  const [open, setOpen] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const { flatCategories } = useCategories()

  const activeCount = countActiveFilters(filters)

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase()
    if (!tag) return
    const existing = filters.tags ?? []
    if (existing.includes(tag)) return
    onFiltersChange({ tags: [...existing, tag] })
    setTagInput('')
  }

  function removeTag(tag: string) {
    onFiltersChange({ tags: (filters.tags ?? []).filter(t => t !== tag) })
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    }
    if (e.key === 'Backspace' && !tagInput && filters.tags?.length) {
      removeTag(filters.tags[filters.tags.length - 1])
    }
  }

  function clearAll() {
    onFiltersChange({
      category_id: undefined,
      tags: [],
      link_status: undefined,
      is_pinned: undefined,
      date_from: undefined,
      date_to: undefined,
    })
  }

  return (
    <div className={cn('rounded-xl border bg-card', className)}>
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden="true" />
          Filters
          {activeCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </span>
        {open ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>

      {/* Filter panel */}
      {open && (
        <div className="border-t px-4 pb-4 pt-3">
          <div className="flex flex-col gap-4">

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <select
                value={filters.category_id ?? ''}
                onChange={e => onFiltersChange({ category_id: e.target.value || undefined })}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="">All categories</option>
                {flatCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tags</label>
              <div className="flex min-h-8 flex-wrap gap-1 rounded-lg border border-input bg-transparent px-2.5 py-1 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50">
                {(filters.tags ?? []).map(tag => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      aria-label={`Remove tag ${tag}`}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => addTag(tagInput)}
                  placeholder={(filters.tags?.length ?? 0) > 0 ? '' : 'Add tag…'}
                  className="min-w-[80px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <p className="text-xs text-muted-foreground">Enter or comma to add</p>
            </div>

            {/* Link status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Link status</label>
              <select
                value={filters.link_status ?? ''}
                onChange={e => onFiltersChange({ link_status: (e.target.value as LinkStatus) || undefined })}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="">Any status</option>
                {LINK_STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Date range */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Date added</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  aria-label="From date"
                  value={filters.date_from ? filters.date_from.slice(0, 10) : ''}
                  onChange={e => onFiltersChange({
                    date_from: e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined,
                  })}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                />
                <input
                  type="date"
                  aria-label="To date"
                  value={filters.date_to ? filters.date_to.slice(0, 10) : ''}
                  onChange={e => onFiltersChange({
                    date_to: e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined,
                  })}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </div>
            </div>

            {/* Pinned toggle */}
            <label className="flex cursor-pointer items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Pinned only</span>
              <input
                type="checkbox"
                checked={filters.is_pinned === true}
                onChange={e => onFiltersChange({ is_pinned: e.target.checked ? true : undefined })}
                className="size-4 rounded border-input accent-primary"
              />
            </label>

            {/* Sort */}
            <div className="flex gap-2">
              <div className="flex flex-1 flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Sort by</label>
                <select
                  value={filters.sort_by ?? 'created_at'}
                  onChange={e => onFiltersChange({ sort_by: e.target.value as SearchFilters['sort_by'] })}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option value="created_at">Date added</option>
                  <option value="updated_at">Last updated</option>
                  <option value="title">Title</option>
                </select>
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Order</label>
                <select
                  value={filters.sort_dir ?? 'desc'}
                  onChange={e => onFiltersChange({ sort_dir: e.target.value as 'asc' | 'desc' })}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option value="desc">Newest first</option>
                  <option value="asc">Oldest first</option>
                </select>
              </div>
            </div>

            {/* Clear all */}
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="mt-1 flex items-center justify-center gap-1.5 rounded-lg border border-input py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function countActiveFilters(filters: SearchFilters): number {
  let n = 0
  if (filters.category_id) n++
  if (filters.tags?.length) n++
  if (filters.link_status) n++
  if (filters.is_pinned !== undefined) n++
  if (filters.date_from || filters.date_to) n++
  return n
}
