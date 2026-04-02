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
  const preview = bookmarks.slice(0, 3)
  const fanned = bookmarks.slice(0, 5) // max visible cards when expanded

  if (count === 0) {
    return (
      <div
        className={cn(
          'flex h-44 items-center justify-center rounded-xl border border-dashed bg-card text-center',
          className,
        )}
        style={{ borderColor: categoryColor + '60' }}
      >
        <div>
          <p className="text-sm font-medium" style={{ color: categoryColor }}>{categoryName}</p>
          <p className="mt-1 text-xs text-muted-foreground">No bookmarks yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <AnimatePresence mode="wait">
        {!expanded ? (
          // ── Collapsed: card pile ──────────────────────────────────────────
          <motion.button
            key="stack"
            type="button"
            onClick={() => setExpanded(true)}
            className="relative h-44 w-full cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Back cards (decorative) */}
            {count >= 3 && (
              <div
                className="absolute inset-x-2 top-2 h-full rounded-xl border bg-card shadow-sm"
                style={{ transform: 'rotate(3deg)', borderColor: categoryColor + '40' }}
              />
            )}
            {count >= 2 && (
              <div
                className="absolute inset-x-1 top-1 h-full rounded-xl border bg-card shadow-sm"
                style={{ transform: 'rotate(-1.5deg)', borderColor: categoryColor + '60' }}
              />
            )}

            {/* Top card */}
            <div
              className="absolute inset-0 flex flex-col rounded-xl border bg-card p-4 shadow-md transition-shadow hover:shadow-lg"
              style={{ borderColor: categoryColor + '80', borderLeftWidth: 3, borderLeftColor: categoryColor }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: categoryColor }}>
                  {categoryName}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {count} link{count !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Favicon preview row */}
              <div className="mt-3 flex items-center gap-1.5">
                {preview.map(b => (
                  <Favicon key={b.id} domain={b.domain} faviconUrl={b.favicon_url} size={20} />
                ))}
                {count > 3 && (
                  <span className="text-xs text-muted-foreground">+{count - 3}</span>
                )}
              </div>

              {/* Top bookmark title */}
              {bookmarks[0] && (
                <p className="mt-auto line-clamp-1 text-xs text-muted-foreground">
                  {bookmarks[0].title}
                </p>
              )}
            </div>
          </motion.button>
        ) : (
          // ── Expanded: fan-out ─────────────────────────────────────────────
          <motion.div
            key="fanned"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-semibold" style={{ color: categoryColor }}>
                {categoryName}
              </span>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Collapse
              </button>
            </div>

            <div className="flex flex-col gap-1">
              {fanned.map((bookmark, i) => (
                <motion.button
                  key={bookmark.id}
                  type="button"
                  onClick={() => onBookmarkClick?.(bookmark)}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                  className="flex w-full items-center gap-2 rounded-lg border bg-card px-3 py-2 text-left transition-colors hover:bg-muted/50"
                >
                  <Favicon domain={bookmark.domain} faviconUrl={bookmark.favicon_url} size={16} />
                  <span className="min-w-0 flex-1 truncate text-xs">{bookmark.title}</span>
                </motion.button>
              ))}

              {count > 5 && (
                <p className="px-1 text-xs text-muted-foreground">+{count - 5} more</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
