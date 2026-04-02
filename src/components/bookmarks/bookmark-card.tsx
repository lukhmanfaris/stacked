'use client'

import { useState } from 'react'
import { Pin, ExternalLink, Copy, Pencil, Trash2, Circle } from 'lucide-react'
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

interface BookmarkCardProps {
  bookmark: Bookmark
  showOgImage?: boolean
  selected?: boolean
  onSelect?: (id: string, selected: boolean) => void
  onEdit?: (bookmark: Bookmark) => void
  onDelete?: (id: string) => void
  className?: string
}

export function BookmarkCard({
  bookmark,
  showOgImage = true,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
  className,
}: BookmarkCardProps) {
  const [actionsVisible, setActionsVisible] = useState(false)

  function copyUrl() {
    navigator.clipboard.writeText(bookmark.url)
  }

  return (
    <article
      className={cn(
        'group relative flex flex-col gap-3 rounded-xl border bg-card p-4 transition-shadow',
        'hover:shadow-md focus-within:ring-2 focus-within:ring-ring',
        selected && 'ring-2 ring-primary',
        className,
      )}
      onMouseEnter={() => setActionsVisible(true)}
      onMouseLeave={() => setActionsVisible(false)}
    >
      {/* Selection checkbox */}
      {onSelect && (
        <input
          type="checkbox"
          aria-label={`Select ${bookmark.title}`}
          checked={selected}
          onChange={e => onSelect(bookmark.id, e.target.checked)}
          className="absolute left-3 top-3 z-10 size-4 rounded border-input accent-primary"
        />
      )}

      {/* Pin indicator */}
      {bookmark.is_pinned && (
        <Pin
          className="absolute right-3 top-3 size-3.5 fill-primary text-primary"
          aria-label="Pinned"
        />
      )}

      {/* OG image */}
      {showOgImage && bookmark.og_image_url && (
        <img
          src={bookmark.og_image_url}
          alt=""
          aria-hidden="true"
          className="aspect-video w-full rounded-lg object-cover"
          loading="lazy"
        />
      )}

      {/* Favicon + title */}
      <div className="flex items-start gap-2 pr-5">
        <Favicon domain={bookmark.domain} faviconUrl={bookmark.favicon_url} size={16} className="mt-0.5 shrink-0" />
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="line-clamp-2 text-sm font-medium leading-snug hover:underline"
        >
          {bookmark.title}
        </a>
      </div>

      {/* Domain + link status */}
      <div className="flex items-center gap-1.5">
        <Circle className={cn('size-2 fill-current', STATUS_COLOR[bookmark.link_status])} aria-hidden="true" />
        <span className="text-xs text-muted-foreground">{bookmark.domain}</span>
      </div>

      {/* Description */}
      {bookmark.description && (
        <p className="line-clamp-2 text-xs text-muted-foreground">{bookmark.description}</p>
      )}

      {/* Tags */}
      {bookmark.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {bookmark.tags.map(tag => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Hover action bar */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 rounded-b-xl border-t bg-card/95 px-3 py-1.5 backdrop-blur-sm transition-opacity',
          actionsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
      >
        <ActionButton icon={<ExternalLink className="size-3.5" />} label="Open" href={bookmark.url} />
        <ActionButton icon={<Copy className="size-3.5" />} label="Copy URL" onClick={copyUrl} />
        {onEdit && (
          <ActionButton icon={<Pencil className="size-3.5" />} label="Edit" onClick={() => onEdit(bookmark)} />
        )}
        {onDelete && (
          <ActionButton
            icon={<Trash2 className="size-3.5 text-destructive" />}
            label="Delete"
            onClick={() => onDelete(bookmark.id)}
          />
        )}
      </div>
    </article>
  )
}

function ActionButton({
  icon,
  label,
  onClick,
  href,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  href?: string
}) {
  const cls = 'inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors'

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={cls}>
        {icon}
      </a>
    )
  }

  return (
    <button type="button" aria-label={label} onClick={onClick} className={cls}>
      {icon}
    </button>
  )
}
