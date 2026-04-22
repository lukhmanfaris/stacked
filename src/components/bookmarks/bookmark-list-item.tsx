'use client'

import { useState, useRef, useEffect } from 'react'
import { Pin, Heart, ExternalLink, Pencil, Trash2, Archive, RotateCcw, AlertTriangle, MoreHorizontal } from 'lucide-react'
import { Favicon } from '@/components/shared/favicon'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { tagColor } from '@/lib/tag-color'
import { cn } from '@/lib/utils'
import { LinkStatusBadge } from '@/components/shared/link-status-badge'
import type { Bookmark } from '@/types/bookmark'

interface BookmarkListItemProps {
  bookmark: Bookmark
  selected?: boolean
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
  className?: string
}

export function BookmarkListItem({
  bookmark,
  selected = false,
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
  className,
}: BookmarkListItemProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(bookmark.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function handleDoubleClick() {
    setDraft(bookmark.title)
    setEditing(true)
  }

  function commitEdit() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== bookmark.title) {
      onTitleUpdate?.(bookmark.id, trimmed)
    }
    setEditing(false)
  }

  function cancelEdit() {
    setDraft(bookmark.title)
    setEditing(false)
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-3 border-b border-[var(--nd-border)] bg-[var(--nd-surface)] px-4 py-3 transition-colors hover:bg-[var(--nd-surface-raised)]',
        selected && 'border-l-2 border-l-[var(--nd-text-display)]',
        className,
      )}
    >
      {/* Checkbox */}
      {onSelect && (
        <input
          type="checkbox"
          aria-label={`Select ${bookmark.title}`}
          checked={selected}
          onChange={e => onSelect(bookmark.id, e.target.checked)}
          className="size-3.5 shrink-0 rounded-none border-[var(--nd-border-visible)] accent-[var(--nd-text-display)]"
        />
      )}

      {/* Favicon */}
      <Favicon domain={bookmark.domain} faviconUrl={bookmark.favicon_url} size={16} className="shrink-0 opacity-80" />

      {/* Title — double-click to edit */}
      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={e => {
              if (e.key === 'Enter') commitEdit()
              if (e.key === 'Escape') cancelEdit()
            }}
            className="w-full border-b border-[var(--nd-border-visible)] bg-transparent font-sans text-sm text-[var(--nd-text-primary)] outline-none focus:border-b-[var(--nd-text-primary)]"
            maxLength={200}
          />
        ) : (
          <span
            className="block cursor-pointer truncate font-sans text-sm font-medium text-[var(--nd-text-primary)]"
            onDoubleClick={handleDoubleClick}
            title={bookmark.title}
          >
            {bookmark.title}
          </span>
        )}
      </div>

      {/* Domain + status */}
      <div className="flex shrink-0 items-center gap-1.5">
        <LinkStatusBadge status={bookmark.link_status} lastCheckedAt={bookmark.last_checked_at} />
        <span className="nd-label hidden text-[var(--nd-text-disabled)] sm:block">{bookmark.domain}</span>
      </div>

      {/* Tags */}
      <div className="hidden shrink-0 items-center gap-1 md:flex">
        {bookmark.tags.slice(0, 3).map(tag => {
          const palette = tagColor(tag)
          return (
            <span
              key={tag}
              className="nd-label rounded-[4px] border px-1.5 py-0.5"
              style={{ backgroundColor: palette.bg, color: palette.fg, borderColor: palette.border }}
            >
              {tag}
            </span>
          )
        })}
      </div>

      {/* Persistent pin + heart (always visible) */}
      <div className="flex shrink-0 items-center gap-0.5">
        {!isTrash && onTogglePin && (
          <button
            type="button"
            aria-label={bookmark.is_pinned ? 'Unpin' : 'Pin'}
            onClick={() => onTogglePin(bookmark.id, !bookmark.is_pinned)}
            className={cn(
              'rounded-[4px] p-1.5 transition-colors',
              bookmark.is_pinned
                ? 'text-[var(--nd-accent)]'
                : 'text-[var(--nd-text-disabled)] hover:text-[var(--nd-text-primary)]',
            )}
          >
            <Pin className={cn('size-3.5', bookmark.is_pinned && 'fill-[var(--nd-accent)]')} />
          </button>
        )}
        {!isTrash && onToggleFavorite && (
          <button
            type="button"
            aria-label={bookmark.is_favorite ? 'Unfavorite' : 'Favorite'}
            onClick={() => onToggleFavorite(bookmark.id, !bookmark.is_favorite)}
            className={cn(
              'rounded-[4px] p-1.5 transition-colors',
              bookmark.is_favorite
                ? 'text-[var(--nd-accent)]'
                : 'text-[var(--nd-text-disabled)] hover:text-[var(--nd-text-primary)]',
            )}
          >
            <Heart className={cn('size-3.5', bookmark.is_favorite && 'fill-[var(--nd-accent)]')} />
          </button>
        )}
      </div>

      {/* Hover-revealed actions (open + edit + kebab) */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open"
          className="rounded-[4px] p-1.5 text-[var(--nd-text-disabled)] hover:bg-[var(--nd-surface-raised)] hover:text-[var(--nd-text-primary)] transition-colors"
        >
          <ExternalLink className="size-3.5" />
        </a>
        {!isTrash && onEdit && (
          <button
            type="button"
            aria-label="Edit"
            onClick={() => onEdit(bookmark)}
            className="rounded-[4px] p-1.5 text-[var(--nd-text-disabled)] hover:bg-[var(--nd-surface-raised)] hover:text-[var(--nd-text-primary)] transition-colors"
          >
            <Pencil className="size-3.5" />
          </button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="More actions"
            className="rounded-[4px] p-1.5 text-[var(--nd-text-disabled)] hover:bg-[var(--nd-surface-raised)] hover:text-[var(--nd-text-primary)] transition-colors outline-none"
          >
            <MoreHorizontal className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-[8px] border-[var(--nd-border-visible)] bg-[var(--nd-surface)] p-1">
            {!isTrash && onArchive && (
              <DropdownMenuItem
                onClick={() => onArchive(bookmark.id)}
                className="nd-label cursor-pointer rounded-[4px] px-3 py-2 text-[var(--nd-text-secondary)] hover:text-[var(--nd-text-primary)] hover:bg-[var(--nd-surface-raised)]"
              >
                <Archive className="mr-2 size-3.5" />
                {bookmark.is_archived ? 'Unarchive' : 'Archive'}
              </DropdownMenuItem>
            )}
            {isTrash && onRestore && (
              <DropdownMenuItem
                onClick={() => onRestore(bookmark.id)}
                className="nd-label cursor-pointer rounded-[4px] px-3 py-2 text-[var(--nd-text-secondary)] hover:text-[var(--nd-text-primary)] hover:bg-[var(--nd-surface-raised)]"
              >
                <RotateCcw className="mr-2 size-3.5" />
                Restore
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-[var(--nd-border)]" />
            {!isTrash && onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(bookmark.id)}
                className="nd-label cursor-pointer rounded-[4px] px-3 py-2 text-[var(--nd-accent)] hover:bg-[var(--nd-accent-subtle)]"
              >
                <Trash2 className="mr-2 size-3.5" />
                Move to Trash
              </DropdownMenuItem>
            )}
            {isTrash && onPermanentDelete && (
              <DropdownMenuItem
                onClick={() => onPermanentDelete(bookmark.id)}
                className="nd-label cursor-pointer rounded-[4px] px-3 py-2 text-[var(--nd-accent)] hover:bg-[var(--nd-accent-subtle)]"
              >
                <AlertTriangle className="mr-2 size-3.5" />
                Delete forever
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
