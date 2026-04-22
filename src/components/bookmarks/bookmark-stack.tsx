'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Favicon } from '@/components/shared/favicon'
import { cn } from '@/lib/utils'
import type { Bookmark } from '@/types/bookmark'

interface BookmarkStackProps {
  categoryName: string
  categoryColor: string
  bookmarks: Bookmark[]
  onBookmarkClick?: (bookmark: Bookmark) => void
  className?: string
}

export function BookmarkStack({
  categoryName,
  categoryColor,
  bookmarks,
  onBookmarkClick,
  className,
}: BookmarkStackProps) {
  const [expanded, setExpanded] = useState(false)

  const count = bookmarks.length
  const preview = bookmarks.slice(0, 4)
  const fanned = bookmarks.slice(0, 6)

  if (count === 0) {
    return (
      <div
        className={cn(
          'flex h-40 items-center justify-center rounded-[12px] border border-dashed border-[var(--nd-border)] text-center',
          className,
        )}
      >
        <div>
          <p className="nd-label text-[var(--nd-text-disabled)]">{categoryName}</p>
          <p className="mt-1 font-sans text-xs text-[var(--nd-text-disabled)]">No bookmarks yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <AnimatePresence mode="wait">
        {!expanded ? (
          /* ── Collapsed: card pile ──────────────────────────────────── */
          <motion.button
            key="stack"
            type="button"
            onClick={() => setExpanded(true)}
            className="relative h-40 w-full cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {/* Back cards (decorative depth) */}
            {count >= 3 && (
              <div
                className="absolute inset-x-2 top-2 h-full rounded-[12px] border border-[var(--nd-border)] bg-[var(--nd-surface-raised)]"
                style={{ transform: 'rotate(2.5deg)' }}
              />
            )}
            {count >= 2 && (
              <div
                className="absolute inset-x-1 top-1 h-full rounded-[12px] border border-[var(--nd-border)] bg-[var(--nd-surface)]"
                style={{ transform: 'rotate(-1deg)' }}
              />
            )}

            {/* Top card */}
            <div className="absolute inset-0 flex flex-col rounded-[12px] border border-[var(--nd-border-visible)] bg-[var(--nd-surface)] p-4 transition-colors hover:border-[var(--nd-text-display)]">
              {/* Category + count */}
              <div className="flex items-center justify-between">
                <span className="nd-label text-[var(--nd-text-primary)]">
                  {categoryName}
                </span>
                <span className="nd-label text-[var(--nd-text-disabled)]">
                  {count}
                </span>
              </div>

              {/* Favicon preview row */}
              <div className="mt-4 flex items-center gap-2">
                {preview.map(b => (
                  <Favicon key={b.id} domain={b.domain} faviconUrl={b.favicon_url} size={16} className="opacity-60" />
                ))}
                {count > 4 && (
                  <span className="nd-label text-[var(--nd-text-disabled)]">+{count - 4}</span>
                )}
              </div>

              {/* Top bookmark title */}
              {bookmarks[0] && (
                <p className="mt-auto truncate font-sans text-xs text-[var(--nd-text-secondary)]">
                  {bookmarks[0].title}
                </p>
              )}
            </div>
          </motion.button>
        ) : (
          /* ── Expanded: list view ────────────────────────────────────── */
          <motion.div
            key="fanned"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col"
          >
            {/* Header */}
            <div className="mb-2 flex items-center justify-between border-b border-[var(--nd-border)] pb-2">
              <span className="nd-label text-[var(--nd-text-primary)]">{categoryName}</span>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="nd-label text-[var(--nd-text-disabled)] hover:text-[var(--nd-text-secondary)] transition-colors"
              >
                Collapse
              </button>
            </div>

            <div className="flex flex-col">
              {fanned.map((bookmark, i) => (
                <motion.button
                  key={bookmark.id}
                  type="button"
                  onClick={() => onBookmarkClick?.(bookmark)}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                  className="flex w-full items-center gap-2 border-b border-[var(--nd-border)] px-0 py-2.5 text-left transition-colors hover:bg-[var(--nd-surface-raised)] last:border-b-0"
                >
                  <Favicon domain={bookmark.domain} faviconUrl={bookmark.favicon_url} size={16} className="shrink-0 opacity-50" />
                  <span className="min-w-0 flex-1 truncate font-sans text-xs text-[var(--nd-text-primary)]">
                    {bookmark.title}
                  </span>
                  <span className="nd-label shrink-0 text-[var(--nd-text-disabled)]">{bookmark.domain}</span>
                </motion.button>
              ))}

              {count > 6 && (
                <p className="nd-label pt-2 text-[var(--nd-text-disabled)]">+{count - 6} more</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
