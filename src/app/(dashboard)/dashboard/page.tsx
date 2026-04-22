'use client'

import { Suspense, useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { BookmarkGrid } from '@/components/bookmarks/bookmark-grid'
import { BookmarkStack } from '@/components/bookmarks/bookmark-stack'
import { BookmarkActions } from '@/components/bookmarks/bookmark-actions'
import { BookmarkForm } from '@/components/bookmarks/bookmark-form'
import { BookmarkCardSkeleton } from '@/components/bookmarks/bookmark-skeleton'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { FilterPanel } from '@/components/dashboard/filter-panel'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { useCategories } from '@/hooks/use-categories'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useDashboard } from '@/contexts/dashboard-context'
import { cn } from '@/lib/utils'
import type { Bookmark, BookmarkFormData } from '@/types/bookmark'

// ─── Keyboard shortcuts ────────────────────────────────────────────────────────

function DashboardShortcuts({
  onNew,
  onToggleView,
  onEscape,
}: {
  onNew: () => void
  onToggleView: () => void
  onEscape: () => void
}) {
  useKeyboardShortcuts({
    NEW_BOOKMARK: onNew,
    TOGGLE_VIEW: onToggleView,
    ESCAPE: onEscape,
  })
  return null
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="nd-label text-[var(--nd-text-secondary)]">No bookmarks yet</p>
      <p className="font-sans text-xs text-[var(--nd-text-disabled)]">
        Press <kbd className="rounded-[2px] border border-[var(--nd-border-visible)] px-1 py-0.5 font-mono text-[10px]">N</kbd> or click + to save your first link.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="nd-label rounded-full border border-[var(--nd-border-visible)] px-6 py-2.5 text-[var(--nd-text-primary)] transition-colors hover:border-[var(--nd-text-display)] hover:text-[var(--nd-text-display)]"
      >
        Add bookmark
      </button>
    </div>
  )
}

// ─── Stack view — grouped by category ─────────────────────────────────────────

function StackView({
  bookmarks,
  categories,
  onBookmarkClick,
}: {
  bookmarks: Bookmark[]
  categories: ReturnType<typeof useCategories>['categories']
  onBookmarkClick: (b: Bookmark) => void
}) {
  const grouped = categories
    .map(cat => ({
      category: cat,
      bookmarks: bookmarks.filter(b => b.category_id === cat.id),
    }))
    .filter(g => g.bookmarks.length > 0)

  const uncategorised = bookmarks.filter(b => !b.category_id)

  return (
    <div className="grid gap-6 p-6 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
      {grouped.map(({ category, bookmarks: bks }) => (
        <BookmarkStack
          key={category.id}
          categoryName={category.name}
          categoryColor={category.color}
          bookmarks={bks}
          onBookmarkClick={onBookmarkClick}
        />
      ))}
      {uncategorised.length > 0 && (
        <BookmarkStack
          categoryName="Uncategorised"
          categoryColor="#6B7280"
          bookmarks={uncategorised}
          onBookmarkClick={onBookmarkClick}
        />
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type SortKey = 'newest' | 'oldest' | 'az' | 'za' | 'updated'

function sortToFilter(sort: string | null | undefined): { sort_by: 'created_at' | 'updated_at' | 'title'; sort_dir: 'asc' | 'desc' } {
  switch ((sort ?? 'newest') as SortKey) {
    case 'oldest':  return { sort_by: 'created_at', sort_dir: 'asc' }
    case 'az':      return { sort_by: 'title',      sort_dir: 'asc' }
    case 'za':      return { sort_by: 'title',      sort_dir: 'desc' }
    case 'updated': return { sort_by: 'updated_at', sort_dir: 'desc' }
    case 'newest':
    default:        return { sort_by: 'created_at', sort_dir: 'desc' }
  }
}

function buildFiltersFromParams(params: URLSearchParams) {
  const categoryParam = params.get('category')
  const view = params.get('view')
  const tag = params.get('tag')
  const sort = params.get('sort')
  const query = params.get('q') ?? undefined
  const linkStatus = params.get('link_status') as
    | 'unchecked' | 'alive' | 'dead' | 'redirected' | 'timeout' | null
  const filterParam = params.get('filter') // legacy: filter=pinned|archived

  const sortFilters = sortToFilter(sort)

  // view → filter mapping
  let category_id: string | null | undefined = categoryParam ?? undefined
  let is_pinned: boolean | undefined
  let is_archived: boolean | undefined = false
  let is_favorite: boolean | undefined
  let is_trashed: boolean | undefined
  let tags: string[] | undefined

  if (view === 'favorites')      is_favorite = true
  else if (view === 'archive')   is_archived = true
  else if (view === 'trash')     { is_trashed = true; is_archived = undefined }
  else if (view === 'unsorted')  category_id = null
  else if (filterParam === 'pinned')   is_pinned = true
  else if (filterParam === 'archived') is_archived = true

  if (tag) tags = [tag]

  return {
    query,
    category_id,
    is_pinned,
    is_archived,
    is_favorite,
    is_trashed,
    tags,
    link_status: linkStatus ?? undefined,
    ...sortFilters,
  }
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const { viewMode, cycleViewMode, formOpen, setFormOpen } = useDashboard()
  const { categories } = useCategories()

  const initialFilters = buildFiltersFromParams(searchParams)
  const isTrashView = searchParams.get('view') === 'trash'
  const hasAnyFilter =
    !!searchParams.get('view') ||
    !!searchParams.get('tag') ||
    !!searchParams.get('category') ||
    !!searchParams.get('link_status')

  const {
    bookmarks,
    isLoading,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    permanentDelete,
    bulkAction,
    isAdding,
    setFilters,
  } = useBookmarks(initialFilters)

  // Sync URL params → hook filters on navigation (skip first mount — initialFilters handles that)
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    setFilters(buildFiltersFromParams(searchParams))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)

  const allTags = Array.from(
    new Set(bookmarks.flatMap(b => b.tags ?? [])),
  )

  function handleSelect(id: string, selected: boolean) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      selected ? next.add(id) : next.delete(id)
      return next
    })
  }

  function handleSelectAll() {
    setSelectedIds(new Set(bookmarks.map(b => b.id)))
  }

  function handleClearSelection() {
    setSelectedIds(new Set())
  }

  async function handleBulkAction(ids: string[], action: Parameters<typeof bulkAction>[1]) {
    await bulkAction(ids, action)
    setSelectedIds(new Set())
  }

  async function handleAdd(data: BookmarkFormData) {
    await addBookmark(data)
    setFormOpen(false)
    toast.success('Bookmark saved')
  }

  async function handleEdit(data: BookmarkFormData) {
    if (!editingBookmark) return
    await updateBookmark(editingBookmark.id, data)
    setEditingBookmark(null)
    toast.success('Bookmark updated')
  }

  async function handleDelete(id: string) {
    await deleteBookmark(id)
    toast.success('Moved to Trash')
  }

  async function handlePermanentDelete(id: string) {
    if (!confirm('Permanently delete this bookmark? This cannot be undone.')) return
    await permanentDelete(id)
    toast.success('Bookmark deleted forever')
  }

  async function handleRestore(id: string) {
    await bulkAction([id], { type: 'restore' })
    toast.success('Bookmark restored')
  }

  async function handleTogglePin(id: string, next: boolean) {
    await bulkAction([id], { type: next ? 'pin' : 'unpin' })
  }

  async function handleToggleFavorite(id: string, next: boolean) {
    await bulkAction([id], { type: next ? 'favorite' : 'unfavorite' })
  }

  async function handleArchiveSingle(id: string) {
    const target = bookmarks.find(b => b.id === id)
    if (!target) return
    await bulkAction([id], { type: target.is_archived ? 'unarchive' : 'archive' })
    toast.success(target.is_archived ? 'Unarchived' : 'Archived')
  }

  const openAdd = useCallback(() => setFormOpen(true), [setFormOpen])
  const closeForm = useCallback(() => {
    setFormOpen(false)
    setEditingBookmark(null)
  }, [setFormOpen])

  return (
    <>
      <DashboardShortcuts
        onNew={openAdd}
        onToggleView={cycleViewMode}
        onEscape={closeForm}
      />

      {/* ── Bulk actions toolbar ─────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-20 border-b border-[var(--nd-border)] bg-[var(--nd-surface)] px-4 py-2">
          <BookmarkActions
            selectedIds={Array.from(selectedIds)}
            onAction={handleBulkAction}
            onClearSelection={handleClearSelection}
            onSelectAll={handleSelectAll}
          />
        </div>
      )}

      {/* ── Stats — only on default "All Bookmarks" view ─────── */}
      {!hasAnyFilter && (
        <div className="px-6 pt-6">
          <DashboardStats />
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <BookmarkCardSkeleton key={i} />
          ))}
        </div>
      ) : bookmarks.length === 0 ? (
        <EmptyState onAdd={openAdd} />
      ) : viewMode === 'stack' ? (
        <StackView
          bookmarks={bookmarks}
          categories={categories}
          onBookmarkClick={b => setEditingBookmark(b)}
        />
      ) : (
        <BookmarkGrid
          bookmarks={bookmarks}
          view={viewMode === 'grid' ? 'grid' : 'list'}
          selectedIds={selectedIds}
          isTrash={isTrashView}
          onSelect={handleSelect}
          onEdit={b => setEditingBookmark(b)}
          onDelete={handleDelete}
          onPermanentDelete={handlePermanentDelete}
          onRestore={handleRestore}
          onTogglePin={handleTogglePin}
          onToggleFavorite={handleToggleFavorite}
          onArchive={handleArchiveSingle}
          className={cn(viewMode === 'list' && 'gap-1')}
        />
      )}

      {/* ── Filter slide-over ─────────────────────────────────── */}
      <FilterPanel />

      {/* ── Add / Edit form modal ─────────────────────────────── */}
      {(formOpen || editingBookmark) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg rounded-[16px] border border-[var(--nd-border-visible)] bg-[var(--nd-surface)]">
            <div className="border-b border-[var(--nd-border)] px-4 py-3">
              <h2 className="nd-label text-[var(--nd-text-secondary)]">
                {editingBookmark ? 'Edit bookmark' : 'Add bookmark'}
              </h2>
            </div>
            <div className="p-4">
              <BookmarkForm
                defaultValues={editingBookmark ?? undefined}
                existingTags={allTags}
                onSubmit={editingBookmark ? handleEdit : handleAdd}
                onCancel={closeForm}
                isSubmitting={isAdding}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  )
}
