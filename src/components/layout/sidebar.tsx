'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  Bookmark as BookmarkIcon,
  Heart,
  Archive,
  Trash2,
  Download,
  Inbox,
  Plus,
  X,
} from 'lucide-react'
import { CategoryTree } from '@/components/categories/category-tree'
import { CategoryForm } from '@/components/categories/category-form'
import { useCategories } from '@/hooks/use-categories'
import { useBookmarkCounts } from '@/hooks/use-bookmark-counts'
import { useDashboard } from '@/contexts/dashboard-context'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CategoryFormData } from '@/types/category'

const SIDEBAR_WIDTH_KEY = 'stacked:sidebar-width'
const MIN_WIDTH = 220
const MAX_WIDTH = 340
const DEFAULT_WIDTH = 260
const TAGS_VISIBLE = 12

interface SystemView {
  key: string
  label: string
  icon: React.ElementType
  href: string
  countKey?: 'total' | 'favorites' | 'archived' | 'trashed'
}

const SYSTEM_VIEWS: SystemView[] = [
  { key: 'all',       label: 'All Bookmarks', icon: BookmarkIcon, href: '/dashboard',                  countKey: 'total' },
  { key: 'favorites', label: 'Favorites',     icon: Heart,        href: '/dashboard?view=favorites',   countKey: 'favorites' },
  { key: 'archive',   label: 'Archive',       icon: Archive,      href: '/dashboard?view=archive',     countKey: 'archived' },
  { key: 'trash',     label: 'Trash',         icon: Trash2,       href: '/dashboard?view=trash',       countKey: 'trashed' },
  { key: 'import',    label: 'Import',        icon: Download,     href: '/settings/import-export' },
]

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { sidebarOpen, setSidebarOpen } = useDashboard()
  const { categories, reorderCategories, addCategory, flatCategories } = useCategories()
  const { counts } = useBookmarkCounts()

  const activeCategoryId = searchParams.get('category') ?? undefined
  const activeView = searchParams.get('view') ?? undefined
  const activeTag = searchParams.get('tag') ?? undefined

  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [tagsExpanded, setTagsExpanded] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH)

  const dragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(DEFAULT_WIDTH)

  useEffect(() => {
    const stored = parseInt(localStorage.getItem(SIDEBAR_WIDTH_KEY) ?? '', 10)
    if (!isNaN(stored)) {
      setSidebarWidth(Math.min(Math.max(stored, MIN_WIDTH), MAX_WIDTH))
    }
  }, [])

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!dragging.current) return
      const delta = e.clientX - startX.current
      const next = Math.min(Math.max(startWidth.current + delta, MIN_WIDTH), MAX_WIDTH)
      setSidebarWidth(next)
    }
    function onUp() {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      setSidebarWidth(w => {
        localStorage.setItem(SIDEBAR_WIDTH_KEY, String(w))
        return w
      })
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [])

  function onDragStart(e: React.PointerEvent) {
    dragging.current = true
    startX.current = e.clientX
    startWidth.current = sidebarWidth
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
  }

  async function handleAddCategory(data: CategoryFormData) {
    await addCategory(data)
    setShowCategoryForm(false)
  }

  function isSystemActive(view: SystemView) {
    if (view.href === '/settings/import-export') return pathname === '/settings/import-export'
    if (view.key === 'all') {
      return pathname === '/dashboard' && !activeView && !activeCategoryId && !activeTag
    }
    return pathname === '/dashboard' && activeView === view.key && !activeCategoryId && !activeTag
  }

  function isUnsortedActive() {
    return pathname === '/dashboard' && activeView === 'unsorted'
  }

  function handleCategorySelect(id: string) {
    router.push(`/dashboard?category=${id}`)
    if (window.innerWidth < 1024) setSidebarOpen(false)
  }

  function closeMobileIfNeeded() {
    if (window.innerWidth < 1024) setSidebarOpen(false)
  }

  // Sort tags by count desc; show top N unless expanded
  const sortedTags = useMemo(() => {
    return Object.entries(counts.by_tag ?? {})
      .sort((a, b) => b[1] - a[1])
  }, [counts])
  const visibleTags = tagsExpanded ? sortedTags : sortedTags.slice(0, TAGS_VISIBLE)

  const navContent = (
    <div className="flex h-full flex-col overflow-y-auto px-3 py-4">
      {/* ── System views ─────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-col gap-0.5">
        {SYSTEM_VIEWS.map(view => {
          const Icon = view.icon
          const active = isSystemActive(view)
          const count = view.countKey ? counts[view.countKey] : undefined
          return (
            <Link
              key={view.key}
              href={view.href}
              onClick={closeMobileIfNeeded}
              className={cn(
                'group flex items-center gap-2.5 rounded-[6px] px-2 py-1.5 transition-colors',
                active
                  ? 'bg-[var(--nd-surface-raised)] text-[var(--nd-text-display)]'
                  : 'text-[var(--nd-text-secondary)] hover:bg-[var(--nd-surface-raised)] hover:text-[var(--nd-text-primary)]',
              )}
            >
              <Icon className={cn(
                'size-4 shrink-0',
                view.key === 'favorites' && active ? 'fill-[var(--nd-accent)] text-[var(--nd-accent)]' : '',
                view.key === 'trash' && active ? 'text-[var(--nd-accent)]' : '',
              )} />
              <span className="flex-1 truncate text-left font-sans text-[13px]">{view.label}</span>
              {typeof count === 'number' && count > 0 && (
                <span className="font-mono text-[10px] tabular-nums text-[var(--nd-text-disabled)]">
                  {count}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* ── COLLECTIONS ──────────────────────────────────────────────── */}
      <div className="mb-2 flex items-center justify-between px-2">
        <span className="nd-label text-[var(--nd-text-disabled)]">Collections</span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setShowCategoryForm(prev => !prev)}
          aria-label="Add collection"
        >
          <Plus className="size-3" />
        </Button>
      </div>

      {showCategoryForm && (
        <div className="mb-3 rounded-[8px] border border-[var(--nd-border-visible)] bg-[var(--nd-surface)] p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="nd-label text-[var(--nd-text-secondary)]">New Collection</span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setShowCategoryForm(false)}
              aria-label="Cancel"
            >
              <X className="size-3" />
            </Button>
          </div>
          <CategoryForm
            onSubmit={handleAddCategory}
            parentOptions={flatCategories.map(c => ({ id: c.id, name: c.name }))}
          />
        </div>
      )}

      <CategoryTree
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelect={handleCategorySelect}
        onReorder={items => reorderCategories(items)}
        counts={counts.by_category}
      />

      {/* Unsorted */}
      <Link
        href="/dashboard?view=unsorted"
        onClick={closeMobileIfNeeded}
        className={cn(
          'mt-1 flex items-center gap-2 rounded-[6px] px-2 py-1.5 transition-colors',
          isUnsortedActive()
            ? 'bg-[var(--nd-surface-raised)] text-[var(--nd-text-display)]'
            : 'text-[var(--nd-text-secondary)] hover:bg-[var(--nd-surface-raised)] hover:text-[var(--nd-text-primary)]',
        )}
      >
        <Inbox className="size-3.5 shrink-0 text-[var(--nd-text-disabled)]" />
        <span className="flex-1 truncate text-left font-sans text-[13px]">Unsorted</span>
        {counts.unsorted > 0 && (
          <span className="font-mono text-[10px] tabular-nums text-[var(--nd-text-disabled)]">
            {counts.unsorted}
          </span>
        )}
      </Link>

      {/* ── TAGS ─────────────────────────────────────────────────────── */}
      {sortedTags.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between px-2">
            <span className="nd-label text-[var(--nd-text-disabled)]">Tags</span>
            {sortedTags.length > TAGS_VISIBLE && (
              <button
                type="button"
                onClick={() => setTagsExpanded(prev => !prev)}
                className="nd-label text-[var(--nd-text-disabled)] hover:text-[var(--nd-text-primary)] transition-colors"
              >
                {tagsExpanded ? 'Less' : `+${sortedTags.length - TAGS_VISIBLE}`}
              </button>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            {visibleTags.map(([tag, count]) => {
              const active = activeTag === tag
              return (
                <Link
                  key={tag}
                  href={`/dashboard?tag=${encodeURIComponent(tag)}`}
                  onClick={closeMobileIfNeeded}
                  className={cn(
                    'flex items-center gap-2 rounded-[6px] px-2 py-1.5 transition-colors',
                    active
                      ? 'bg-[var(--nd-surface-raised)] text-[var(--nd-text-display)]'
                      : 'text-[var(--nd-text-secondary)] hover:bg-[var(--nd-surface-raised)] hover:text-[var(--nd-text-primary)]',
                  )}
                >
                  <span className="font-mono text-[var(--nd-text-disabled)]">#</span>
                  <span className="flex-1 truncate text-left font-sans text-[13px]">{tag}</span>
                  <span className="font-mono text-[10px] tabular-nums text-[var(--nd-text-disabled)]">
                    {count}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )

  const brandBlock = (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--nd-border)] px-3">
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="grid size-8 place-items-center rounded-[8px] bg-[var(--nd-accent)] text-[var(--nd-surface)]"
        >
          <BookmarkIcon className="size-4" strokeWidth={2.5} />
        </span>
        <span className="font-display text-[18px] font-bold tracking-[0.04em] text-[var(--nd-text-display)]">
          Bookmarks
        </span>
      </Link>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => setSidebarOpen(false)}
        aria-label="Close sidebar"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  )

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside
        className="relative hidden shrink-0 border-r border-[var(--nd-border)] bg-[var(--nd-surface)] lg:flex lg:flex-col"
        style={{
          width: sidebarOpen ? sidebarWidth : 0,
          transition: 'width 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
          overflow: sidebarOpen ? 'visible' : 'hidden',
        }}
      >
        {sidebarOpen && (
          <>
            {brandBlock}
            <div className="min-h-0 flex-1">{navContent}</div>
            <div
              className="absolute inset-y-0 right-0 w-1 cursor-col-resize opacity-0 hover:opacity-100 hover:bg-[var(--nd-border-visible)] transition-opacity"
              onPointerDown={onDragStart}
            />
          </>
        )}
      </aside>

      {/* ── Mobile drawer ────────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-[var(--nd-text-display)]/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-[var(--nd-surface)] border-r border-[var(--nd-border)]">
            {brandBlock}
            <div className="min-h-0 flex-1">{navContent}</div>
          </aside>
        </div>
      )}
    </>
  )
}
