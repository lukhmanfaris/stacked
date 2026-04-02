'use client'

import { useState, useRef, useEffect } from 'react'
import { Pin, Circle, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { Favicon } from '@/components/shared/favicon'
import { cn } from '@/lib/utils'
import type { Bookmark } from '@/types/bookmark'

const STATUS_COLOR: Record<Bookmark['link_status'], string> = {
  unchecked: 'text-muted-foreground',
  alive:     'text-green-500',
  dead:      'text-red-500',
  redirected:'text-yellow-500',
  timeout:   'text-orange-500',
}

interface BookmarkListItemProps {
  bookmark: Bookmark
  selected?: boolean
  onSelect?: (id: string, selected: boolean) => void
  onEdit?: (bookmark: Bookmark) => void
  onDelete?: (id: string) => void
  onTitleUpdate?: (id: string, title: string) => void
  className?: string
}

export function BookmarkListItem({
  bookmark,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
  onTitleUpdate,
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
        'group flex items-center gap-3 rounded-lg border bg-card px-4 py-2.5 transition-colors hover:bg-muted/50',
        selected && 'ring-2 ring-primary',
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
          className="size-4 shrink-0 rounded border-input accent-primary"
        />
      )}

      {/* Favicon */}
      <Favicon domain={bookmark.domain} faviconUrl={bookmark.favicon_url} size={16} className="shrink-0" />

      {/* Title — double-click to edit inline */}
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
            className="w-full rounded bg-muted px-1 py-0.5 text-sm outline-none ring-2 ring-primary"
            maxLength={200}
          />
        ) : (
          <span
            className="block cursor-pointer truncate text-sm font-medium"
            onDoubleClick={handleDoubleClick}
            title={bookmark.title}
          >
            {bookmark.title}
          </span>
        )}
      </div>

      {/* Domain + status */}
      <div className="flex shrink-0 items-center gap-1.5">
        <Circle className={cn('size-2 fill-current', STATUS_COLOR[bookmark.link_status])} aria-hidden="true" />
        <span className="hidden text-xs text-muted-foreground sm:block">{bookmark.domain}</span>
      </div>

      {/* Tags */}
      <div className="hidden shrink-0 items-center gap-1 md:flex">
        {bookmark.tags.slice(0, 3).map(tag => (
          <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {tag}
          </span>
        ))}
      </div>

      {/* Pin */}
      {bookmark.is_pinned && (
        <Pin className="size-3 shrink-0 fill-primary text-primary" aria-label="Pinned" />
      )}

      {/* Actions (visible on hover) */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open"
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ExternalLink className="size-3.5" />
        </a>
        {onEdit && (
          <button
            type="button"
            aria-label="Edit"
            onClick={() => onEdit(bookmark)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Pencil className="size-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            aria-label="Delete"
            onClick={() => onDelete(bookmark.id)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
