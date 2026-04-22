'use client'

import { Pin, Heart, MoreHorizontal, ExternalLink, Copy, Pencil, Archive, Trash2, RotateCcw, AlertTriangle } from 'lucide-react'
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

const DATE_FMT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

interface BookmarkCardProps {
  bookmark: Bookmark
  showOgImage?: boolean
  selected?: boolean
  /** Whether the card lives in the Trash view; swaps action set */
  isTrash?: boolean
  onSelect?: (id: string, selected: boolean) => void
  onEdit?: (bookmark: Bookmark) => void
  /** Soft-delete (Trash) */
  onDelete?: (id: string) => void
  /** Permanent delete (Trash → gone) */
  onPermanentDelete?: (id: string) => void
  /** Restore from Trash */
  onRestore?: (id: string) => void
  onTogglePin?: (id: string, next: boolean) => void
  onToggleFavorite?: (id: string, next: boolean) => void
  onArchive?: (id: string) => void
  className?: string
}

export function BookmarkCard({
  bookmark,
  showOgImage = true,
  selected = false,
  isTrash = false,
  onSelect,
  onEdit,
  onDelete,
  onPermanentDelete,
  onRestore,
  onTogglePin,
  onToggleFavorite,
  onArchive,
  className,
}: BookmarkCardProps) {
  function copyUrl() { navigator.clipboard.writeText(bookmark.url) }

  const formattedDate = (() => {
    try { return DATE_FMT.format(new Date(bookmark.created_at)) }
    catch { return '' }
  })()

  return (
    <article
      className={cn(
        'group relative flex flex-col rounded-[12px] border border-[var(--nd-border)] bg-[var(--nd-surface)] transition-colors overflow-hidden',
        'hover:border-[var(--nd-border-visible)]',
        selected && 'border-[var(--nd-text-display)]',
        className,
      )}
    >
      {/* ── Hero block ───────────────────────────────────────────── */}
      <div className="relative aspect-[5/3] w-full overflow-hidden bg-[var(--nd-surface-raised)]">
        {/* Selection checkbox */}
        {onSelect && (
          <input
            type="checkbox"
            aria-label={`Select ${bookmark.title}`}
            checked={selected}
            onChange={e => onSelect(bookmark.id, e.target.checked)}
            onClick={e => e.stopPropagation()}
            className="absolute left-3 top-3 z-20 size-3.5 rounded-none border-[var(--nd-border-visible)] accent-[var(--nd-text-display)]"
          />
        )}

        {/* OG image (when present) */}
        {showOgImage && bookmark.og_image_url ? (
          <img
            src={bookmark.og_image_url}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 size-full object-cover"
            loading="lazy"
          />
        ) : (
          /* Centered enlarged favicon fallback */
          <div className="absolute inset-0 grid place-items-center">
            <span className="grid size-14 place-items-center rounded-[12px] bg-[var(--nd-surface)] shadow-sm ring-1 ring-[var(--nd-border)]">
              <Favicon
                domain={bookmark.domain}
                faviconUrl={bookmark.favicon_url}
                size={32}
                className="opacity-90"
              />
            </span>
          </div>
        )}

        {/* Persistent top-right actions */}
        <div className="absolute right-2 top-2 z-10 flex items-center gap-0.5 rounded-[999px] bg-[var(--nd-surface)]/85 px-1 py-0.5 ring-1 ring-[var(--nd-border)] backdrop-blur-sm">
          {!isTrash && onTogglePin && (
            <IconBtn
              ariaLabel={bookmark.is_pinned ? 'Unpin' : 'Pin'}
              active={bookmark.is_pinned}
              activeClass="text-[var(--nd-accent)]"
              onClick={() => onTogglePin(bookmark.id, !bookmark.is_pinned)}
            >
              <Pin className={cn('size-3.5', bookmark.is_pinned && 'fill-[var(--nd-accent)]')} />
            </IconBtn>
          )}
          {!isTrash && onToggleFavorite && (
            <IconBtn
              ariaLabel={bookmark.is_favorite ? 'Unfavorite' : 'Favorite'}
              active={bookmark.is_favorite}
              activeClass="text-[var(--nd-accent)]"
              onClick={() => onToggleFavorite(bookmark.id, !bookmark.is_favorite)}
            >
              <Heart className={cn('size-3.5', bookmark.is_favorite && 'fill-[var(--nd-accent)]')} />
            </IconBtn>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="More actions"
              className="inline-flex size-7 items-center justify-center rounded-full text-[var(--nd-text-secondary)] hover:text-[var(--nd-text-primary)] outline-none focus-visible:ring-1 focus-visible:ring-[var(--nd-border-visible)]"
            >
              <MoreHorizontal className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-[8px] border-[var(--nd-border-visible)] bg-[var(--nd-surface)] p-1">
              <Item icon={<ExternalLink className="size-3.5" />} label="Open" onClick={() => window.open(bookmark.url, '_blank', 'noopener,noreferrer')} />
              <Item icon={<Copy className="size-3.5" />} label="Copy URL" onClick={copyUrl} />
              {!isTrash && onEdit && <Item icon={<Pencil className="size-3.5" />} label="Edit" onClick={() => onEdit(bookmark)} />}
              {!isTrash && onArchive && <Item icon={<Archive className="size-3.5" />} label={bookmark.is_archived ? 'Unarchive' : 'Archive'} onClick={() => onArchive(bookmark.id)} />}
              {isTrash && onRestore && <Item icon={<RotateCcw className="size-3.5" />} label="Restore" onClick={() => onRestore(bookmark.id)} />}
              <DropdownMenuSeparator className="bg-[var(--nd-border)]" />
              {!isTrash && onDelete && <Item danger icon={<Trash2 className="size-3.5" />} label="Move to Trash" onClick={() => onDelete(bookmark.id)} />}
              {isTrash && onPermanentDelete && <Item danger icon={<AlertTriangle className="size-3.5" />} label="Delete forever" onClick={() => onPermanentDelete(bookmark.id)} />}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-2 px-4 pt-3 pb-2">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="line-clamp-2 font-sans text-[14px] font-semibold leading-snug text-[var(--nd-text-display)] hover:underline underline-offset-2"
          title={bookmark.title}
        >
          {bookmark.title}
        </a>

        {bookmark.description && (
          <p className="line-clamp-2 font-sans text-xs leading-relaxed text-[var(--nd-text-secondary)]">
            {bookmark.description}
          </p>
        )}

        {bookmark.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {bookmark.tags.slice(0, 4).map(tag => {
              const palette = tagColor(tag)
              return (
                <span
                  key={tag}
                  className="nd-label rounded-[4px] border px-2 py-0.5"
                  style={{ backgroundColor: palette.bg, color: palette.fg, borderColor: palette.border }}
                >
                  {tag}
                </span>
              )
            })}
            {bookmark.tags.length > 4 && (
              <span className="nd-label rounded-[4px] border border-[var(--nd-border)] px-2 py-0.5 text-[var(--nd-text-disabled)]">
                +{bookmark.tags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--nd-border)] px-4 py-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <LinkStatusBadge status={bookmark.link_status} lastCheckedAt={bookmark.last_checked_at} />
          <Favicon domain={bookmark.domain} faviconUrl={bookmark.favicon_url} size={16} className="opacity-70" />
          <span className="nd-label truncate text-[var(--nd-text-disabled)]">{bookmark.domain}</span>
        </div>
        {formattedDate && (
          <span className="nd-label shrink-0 text-[var(--nd-text-disabled)]">{formattedDate}</span>
        )}
      </div>
    </article>
  )
}

function IconBtn({
  children,
  ariaLabel,
  active,
  activeClass,
  onClick,
}: {
  children: React.ReactNode
  ariaLabel: string
  active?: boolean
  activeClass?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={e => { e.stopPropagation(); onClick() }}
      className={cn(
        'inline-flex size-7 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-1 focus-visible:ring-[var(--nd-border-visible)]',
        active
          ? activeClass
          : 'text-[var(--nd-text-secondary)] hover:text-[var(--nd-text-primary)]',
      )}
    >
      {children}
    </button>
  )
}

function Item({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <DropdownMenuItem
      onClick={onClick}
      className={cn(
        'nd-label cursor-pointer rounded-[4px] px-3 py-2 hover:bg-[var(--nd-surface-raised)]',
        danger
          ? 'text-[var(--nd-accent)] hover:bg-[var(--nd-accent-subtle)]'
          : 'text-[var(--nd-text-secondary)] hover:text-[var(--nd-text-primary)]',
      )}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </DropdownMenuItem>
  )
}
