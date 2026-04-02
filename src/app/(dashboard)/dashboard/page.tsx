'use client'

import { Suspense, useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { BookmarkGrid } from '@/components/bookmarks/bookmark-grid'
import { BookmarkStack } from '@/components/bookmarks/bookmark-stack'
import { BookmarkActions } from '@/components/bookmarks/bookmark-actions'
import { BookmarkForm } from '@/components/bookmarks/bookmark-form'
import { BookmarkCardSkeleton } from '@/components/bookmarks/bookmark-skeleton'
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
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <BookOpen className="size-8 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-medium">No bookmarks yet</p>
        <p className="text-sm text-muted-foreground">
          Press <kbd className="rounded border px-1 py-0.5 text-xs">N</kbd> or click + to save your first link.
        </p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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
    <div className="flex flex-wrap gap-6 p-6">
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

function DashboardContent() {
  const searchParams = useSearchParams()
  const categoryId = searchParams.get('category') ?? undefined
  const filterParam = searchParams.get('filter') ?? undefined
  const { viewMode, cycleViewMode, formOpen, setFormOpen } = useDashboard()
  const { categories } = useCategories()

  const initialFilters = {
    category_id: categoryId,
    is_pinned: filterParam === 'pinned' ? true : undefined,
    is_archived: filterParam === 'archived' ? true : false,
  }

  const {
    bookmarks,
    isLoading,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    bulkAction,
    isAdding,
    setFilters,
  } = useBookmarks(initialFilters)

  // Sync URL params → hook filters on navigation (skip first mount — initialFilters handles that)
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    setFilters({
      category_id: categoryId,
      is_pinned: filterParam === 'pinned' ? true : undefined,
      is_archived: filterParam === 'archived' ? true : false,
    })
  }, [categoryId, filterParam])

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
    toast.success('Bookmark deleted')
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
        <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur px-4 py-2">
          <BookmarkActions
            selectedIds={Array.from(selectedIds)}
            onAction={handleBulkAction}
            onClearSelection={handleClearSelection}
            onSelectAll={handleSelectAll}
          />
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          onSelect={handleSelect}
          onEdit={b => setEditingBookmark(b)}
          onDelete={handleDelete}
          className={cn(viewMode === 'list' && 'gap-1')}
        />
      )}

      {/* ── Add / Edit form modal ─────────────────────────────── */}
      {(formOpen || editingBookmark) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-background shadow-2xl ring-1 ring-border">
            <div className="border-b px-4 py-3">
              <h2 className="text-sm font-semibold">
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
