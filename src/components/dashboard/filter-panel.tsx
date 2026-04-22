'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCategories } from '@/hooks/use-categories'
import { useBookmarkCounts } from '@/hooks/use-bookmark-counts'
import { tagColor } from '@/lib/tag-color'
import { cn } from '@/lib/utils'
import type { LinkStatus } from '@/types/bookmark'

const LINK_STATUSES: { value: LinkStatus | 'all'; label: string }[] = [
  { value: 'all',        label: 'Any status' },
  { value: 'alive',      label: 'Alive' },
  { value: 'dead',       label: 'Dead' },
  { value: 'redirected', label: 'Redirected' },
  { value: 'timeout',    label: 'Timeout' },
  { value: 'unchecked',  label: 'Unchecked' },
]

export function FilterPanel() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { categories } = useCategories()
  const { counts } = useBookmarkCounts()

  const [open, setOpen] = useState(false)

  // Listen for top-bar dispatch event
  useEffect(() => {
    function handleOpen() { setOpen(true) }
    window.addEventListener('dashboard:open-filter-panel', handleOpen as EventListener)
    return () => window.removeEventListener('dashboard:open-filter-panel', handleOpen as EventListener)
  }, [])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Read current filter state from URL
  const activeCategoryId = searchParams.get('category') ?? ''
  const activeTag = searchParams.get('tag') ?? ''
  const activeView = searchParams.get('view') ?? ''
  const activeStatus = (searchParams.get('link_status') as LinkStatus | null) ?? 'all'

  const flatCategories = useMemo(() => {
    return categories.flatMap(c => [c, ...c.children])
  }, [categories])

  const tagsByCount = useMemo(() => {
    return Object.entries(counts.by_tag).sort((a, b) => b[1] - a[1])
  }, [counts])

  const updateParam = useCallback((key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams.toString())
    if (value == null || value === '') next.delete(key)
    else next.set(key, value)
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }, [pathname, router, searchParams])

  function selectCategory(id: string) {
    updateParam('category', activeCategoryId === id ? null : id)
  }

  function selectTag(tag: string) {
    updateParam('tag', activeTag === tag ? null : tag)
  }

  function selectView(view: string) {
    updateParam('view', activeView === view ? null : view)
  }

  function selectStatus(s: string) {
    updateParam('link_status', s === 'all' ? null : s)
  }

  function clearAll() {
    router.replace(pathname)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--nd-text-display)]/40"
        onClick={() => setOpen(false)}
      />

      {/* Slide-over */}
      <aside
        role="dialog"
        aria-label="Filters"
        className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-[var(--nd-border)] bg-[var(--nd-surface)]"
      >
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--nd-border)] px-4">
          <span className="nd-label text-[var(--nd-text-display)]">Filters</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={clearAll}
              className="nd-label rounded-[4px] px-2 py-1 text-[var(--nd-text-disabled)] hover:text-[var(--nd-text-primary)] transition-colors"
            >
              Clear
            </button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setOpen(false)}
              aria-label="Close filters"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Body — scroll */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {/* View */}
          <Section title="View">
            <div className="flex flex-wrap gap-1.5">
              {[
                { v: '',          l: 'All',       n: counts.total },
                { v: 'favorites', l: 'Favorites', n: counts.favorites },
                { v: 'archive',   l: 'Archive',   n: counts.archived },
                { v: 'trash',     l: 'Trash',     n: counts.trashed },
                { v: 'unsorted',  l: 'Unsorted',  n: counts.unsorted },
              ].map(opt => {
                const active = activeView === opt.v
                return (
                  <button
                    key={opt.v || 'all'}
                    type="button"
                    onClick={() => selectView(opt.v)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-[999px] border px-3 py-1.5 transition-colors',
                      'font-mono text-[11px] uppercase tracking-[0.06em]',
                      active
                        ? 'border-[var(--nd-text-primary)] bg-[var(--nd-text-display)] text-[var(--nd-surface)]'
                        : 'border-[var(--nd-border-visible)] text-[var(--nd-text-secondary)] hover:text-[var(--nd-text-primary)] hover:border-[var(--nd-text-primary)]',
                    )}
                  >
                    {opt.l}
                    <span className={cn('tabular-nums', active ? 'opacity-70' : 'text-[var(--nd-text-disabled)]')}>
                      {opt.n}
                    </span>
                  </button>
                )
              })}
            </div>
          </Section>

          {/* Categories */}
          {flatCategories.length > 0 && (
            <Section title="Collections">
              <div className="flex flex-col gap-0.5">
                {flatCategories.map(cat => {
                  const active = activeCategoryId === cat.id
                  const n = counts.by_category[cat.id] ?? cat.bookmark_count ?? 0
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => selectCategory(cat.id)}
                      className={cn(
                        'flex items-center gap-2 rounded-[6px] px-2 py-1.5 transition-colors',
                        active
                          ? 'bg-[var(--nd-surface-raised)] text-[var(--nd-text-display)]'
                          : 'text-[var(--nd-text-secondary)] hover:bg-[var(--nd-surface-raised)] hover:text-[var(--nd-text-primary)]',
                      )}
                    >
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="flex-1 truncate text-left font-sans text-[13px]">{cat.name}</span>
                      <span className="font-mono text-[10px] tabular-nums text-[var(--nd-text-disabled)]">{n}</span>
                      {active && <Check className="size-3 text-[var(--nd-text-display)]" />}
                    </button>
                  )
                })}
              </div>
            </Section>
          )}

          {/* Tags */}
          {tagsByCount.length > 0 && (
            <Section title="Tags">
              <div className="flex flex-wrap gap-1.5">
                {tagsByCount.map(([tag, n]) => {
                  const active = activeTag === tag
                  const palette = tagColor(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => selectTag(tag)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-[6px] border px-2 py-1 transition-colors',
                        'font-mono text-[11px] uppercase tracking-[0.04em]',
                      )}
                      style={
                        active
                          ? { backgroundColor: palette.fg, color: '#FFFFFF', borderColor: palette.fg }
                          : { backgroundColor: palette.bg, color: palette.fg, borderColor: palette.border }
                      }
                    >
                      #{tag}
                      <span className="tabular-nums opacity-80">{n}</span>
                    </button>
                  )
                })}
              </div>
            </Section>
          )}

          {/* Link status */}
          <Section title="Link status">
            <div className="grid grid-cols-2 gap-1.5">
              {LINK_STATUSES.map(s => {
                const active = activeStatus === s.value
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => selectStatus(s.value)}
                    className={cn(
                      'rounded-[6px] border px-3 py-1.5 text-left transition-colors',
                      'font-mono text-[11px] uppercase tracking-[0.06em]',
                      active
                        ? 'border-[var(--nd-text-primary)] bg-[var(--nd-text-display)] text-[var(--nd-surface)]'
                        : 'border-[var(--nd-border-visible)] text-[var(--nd-text-secondary)] hover:border-[var(--nd-text-primary)] hover:text-[var(--nd-text-primary)]',
                    )}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--nd-border)] px-4 py-3">
          <Button variant="secondary" size="sm" onClick={clearAll}>Clear all</Button>
          <Button size="sm" onClick={() => setOpen(false)}>Done</Button>
        </div>
      </aside>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="nd-label mb-3 text-[var(--nd-text-disabled)]">{title}</h3>
      {children}
    </section>
  )
}
