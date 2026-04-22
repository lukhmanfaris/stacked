'use client'

import { motion } from 'framer-motion'
import { BookmarkCard } from './bookmark-card'
import { BookmarkListItem } from './bookmark-list-item'
import { BookmarkCardSkeleton, BookmarkListItemSkeleton } from './bookmark-skeleton'
import { cn } from '@/lib/utils'
import type { Bookmark } from '@/types/bookmark'

type ViewMode = 'grid' | 'list'

interface BookmarkGridProps {
  bookmarks: Bookmark[]
  view?: ViewMode
  isLoading?: boolean
  selectedIds?: Set<string>
  showOgImages?: boolean
  isTrash?: boolean
  onSelect?: (id: string, selected: boolean) => void
  onEdit?: (bookmark: Bookmark) => void
  onDelete?: (id: string) => void
  onPermanentDelete?: (id: string) => void
  onRestore?: (id: string) => void
  onTitleUpdate?: (id: string, title: string) => void
  onTogglePin?: (id: string, next: boolean) => void
  onToggleFavorite?: (id: string, next: boolean) => void
  onArchive?: (id: string) => void
  emptyState?: React.ReactNode
  className?: string
}

const SKELETON_COUNT = 8

export function BookmarkGrid({
  bookmarks,
  view = 'grid',
  isLoading = false,
  selectedIds,
  showOgImages = true,
  isTrash = false,
  onSelect,
  onEdit,
  onDelete,
  onPermanentDelete,
  onRestore,
  onTitleUpdate,
  onTogglePin,
  onToggleFavorite,
  onArchive,
  emptyState,
  className,
}: BookmarkGridProps) {
  if (isLoading) {
    return view === 'grid' ? (
      <div className={cn('grid auto-rows-fr gap-3 p-6 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]', className)}>
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <BookmarkCardSkeleton key={i} />
        ))}
      </div>
    ) : (
      <div className={cn('flex flex-col gap-2', className)}>
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <BookmarkListItemSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <div className={cn('flex min-h-48 items-center justify-center', className)}>
        {emptyState ?? (
          <p className="nd-label text-[var(--nd-text-disabled)]">No bookmarks found.</p>
        )}
      </div>
    )
  }

  if (view === 'list') {
    return (
      <div className={cn('flex flex-col border-t border-[var(--nd-border)]', className)}>
        {bookmarks.map((bookmark, i) => (
          <motion.div
            key={bookmark.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 10) * 0.03 }}
          >
            <BookmarkListItem
              bookmark={bookmark}
              selected={selectedIds?.has(bookmark.id)}
              isTrash={isTrash}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onPermanentDelete={onPermanentDelete}
              onRestore={onRestore}
              onTitleUpdate={onTitleUpdate}
              onTogglePin={onTogglePin}
              onToggleFavorite={onToggleFavorite}
              onArchive={onArchive}
            />
          </motion.div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('grid auto-rows-fr gap-3 p-6 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]', className)}>
      {bookmarks.map((bookmark, i) => (
        <motion.div
          key={bookmark.id}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: Math.min(i, 10) * 0.04, duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <BookmarkCard
            bookmark={bookmark}
            showOgImage={showOgImages}
            selected={selectedIds?.has(bookmark.id)}
            isTrash={isTrash}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
            onPermanentDelete={onPermanentDelete}
            onRestore={onRestore}
            onTogglePin={onTogglePin}
            onToggleFavorite={onToggleFavorite}
            onArchive={onArchive}
            className="h-full"
          />
        </motion.div>
      ))}
    </div>
  )
}
