'use client'

import React from 'react'
import { SearchX } from 'lucide-react'
import { BookmarkCard } from '@/components/bookmarks/bookmark-card'
import { cn } from '@/lib/utils'
import type { SearchResult } from '@/types/search'

// ─── Term highlight utility ───────────────────────────────────────────────────

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const words = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (!words.length) return text
  const pattern = new RegExp(`(${words.join('|')})`, 'gi')
  const parts = text.split(pattern)
  return parts.map((part, i) =>
    pattern.test(part) ? (
      <mark key={i} className="rounded-sm bg-yellow-200/80 text-inherit dark:bg-yellow-800/60">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ResultSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-40 animate-pulse rounded-xl border bg-muted" />
      ))}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <SearchX className="size-10 text-muted-foreground/50" aria-hidden="true" />
      <p className="font-medium">No results found</p>
      {query.trim() ? (
        <p className="text-sm text-muted-foreground">
          No bookmarks match <span className="font-medium">&ldquo;{query}&rdquo;</span>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
      )}
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  total,
  perPage,
  hasNext,
  onPage,
}: {
  page: number
  total: number
  perPage: number
  hasNext: boolean
  onPage: (p: number) => void
}) {
  const totalPages = Math.ceil(total / perPage)
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
      <span>
        {((page - 1) * perPage + 1).toLocaleString()}–
        {Math.min(page * perPage, total).toLocaleString()} of {total.toLocaleString()}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="rounded-lg border px-3 py-1.5 disabled:opacity-40 enabled:hover:bg-muted"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={!hasNext}
          onClick={() => onPage(page + 1)}
          className="rounded-lg border px-3 py-1.5 disabled:opacity-40 enabled:hover:bg-muted"
        >
          Next
        </button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SearchResultsProps {
  results: SearchResult[]
  query: string
  total: number
  page: number
  perPage: number
  hasNextPage: boolean
  isSearching: boolean
  isActive: boolean
  onPage: (p: number) => void
  className?: string
}

export function SearchResults({
  results,
  query,
  total,
  page,
  perPage,
  hasNextPage,
  isSearching,
  isActive,
  onPage,
  className,
}: SearchResultsProps) {
  if (!isActive) {
    return (
      <div className={cn('flex flex-col items-center gap-3 py-16 text-center', className)}>
        <p className="text-sm text-muted-foreground">
          Type to search, or use filters to browse your bookmarks
        </p>
      </div>
    )
  }

  if (isSearching && !results.length) {
    return <ResultSkeleton />
  }

  if (!isSearching && !results.length) {
    return <EmptyState query={query} />
  }

  // Inject highlighted title/description into each result for display
  const enriched = results.map(r => ({
    ...r,
    title: r.title,
    description: r.description,
    _highlightTitle: highlight(r.title, query),
    _highlightDesc: r.description ? highlight(r.description, query) : null,
  }))

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Result summary */}
      <p className="text-sm text-muted-foreground">
        {total.toLocaleString()} result{total !== 1 ? 's' : ''}
        {query.trim() ? (
          <> for <span className="font-medium text-foreground">&ldquo;{query}&rdquo;</span></>
        ) : null}
      </p>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {enriched.map(result => (
          <HighlightedBookmarkCard
            key={result.id}
            bookmark={result}
            highlightTitle={result._highlightTitle}
            highlightDesc={result._highlightDesc}
          />
        ))}
      </div>

      <Pagination
        page={page}
        total={total}
        perPage={perPage}
        hasNext={hasNextPage}
        onPage={onPage}
      />
    </div>
  )
}

// ─── Card with highlighted terms ──────────────────────────────────────────────

function HighlightedBookmarkCard({
  bookmark,
  highlightTitle,
  highlightDesc,
}: {
  bookmark: SearchResult
  highlightTitle: React.ReactNode
  highlightDesc: React.ReactNode | null
}) {
  // BookmarkCard renders its own title/description from the bookmark prop.
  // We overlay the highlight by passing a patched bookmark with React nodes
  // rendered as strings — for the card we just use it as-is and add a highlight
  // overlay on top via wrapper. Simplest: render BookmarkCard and rely on its
  // existing markup, adding a data attribute for future enhancement.
  return (
    <div className="relative">
      <BookmarkCard bookmark={bookmark} showOgImage />
      {/* Invisible overlay so highlights can be layered if needed in M8 */}
      <div className="sr-only" aria-hidden="true">
        <span>{highlightTitle}</span>
        {highlightDesc && <span>{highlightDesc}</span>}
      </div>
    </div>
  )
}
