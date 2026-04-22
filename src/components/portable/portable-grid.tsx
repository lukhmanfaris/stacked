import { cn } from '@/lib/utils'
import type { SharedLinkLayout, SharedLinkTheme } from '@/types/shared-link'

interface PortableBookmark {
  id: string
  url: string
  title: string
  domain: string
  description: string | null
  favicon_url: string | null
  tags: string[]
}

interface PortableGridProps {
  bookmarks: PortableBookmark[]
  layout: SharedLinkLayout
  theme: SharedLinkTheme
  showFavicons: boolean
  showDescriptions: boolean
  showTags: boolean
}

function DomainFavicon({ domain, faviconUrl, size = 16 }: { domain: string; faviconUrl: string | null; size?: number }) {
  if (faviconUrl) {
    return (
      <img
        src={faviconUrl}
        width={size}
        height={size}
        alt=""
        aria-hidden="true"
        className="rounded-sm object-contain"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    )
  }
  const initial = domain.replace(/^www\./, '')[0]?.toUpperCase() ?? '?'
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-sm bg-neutral-200 text-[9px] font-semibold text-neutral-600"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {initial}
    </span>
  )
}

// ─── Minimal layout ────────────────────────────────────────────────────────────

function MinimalLayout({ bookmarks, theme, showFavicons, showTags }: Omit<PortableGridProps, 'layout' | 'showDescriptions'> & { showDescriptions?: boolean }) {
  const isDark = theme === 'dark'
  return (
    <ul className="divide-y" style={{ borderColor: isDark ? '#262626' : '#f3f4f6' }}>
      {bookmarks.map((bm) => (
        <li key={bm.id}>
          <a
            href={bm.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-3 py-3 text-sm transition-opacity hover:opacity-70',
              isDark ? 'text-neutral-200' : 'text-neutral-800',
            )}
          >
            {showFavicons && (
              <DomainFavicon domain={bm.domain} faviconUrl={bm.favicon_url} size={14} />
            )}
            <span className="min-w-0 flex-1 truncate font-medium">{bm.title}</span>
            <span className={cn('shrink-0 text-xs', isDark ? 'text-neutral-500' : 'text-neutral-400')}>
              {bm.domain}
            </span>
            {showTags && bm.tags.length > 0 && (
              <span className={cn('hidden shrink-0 text-xs sm:block', isDark ? 'text-neutral-600' : 'text-neutral-300')}>
                {bm.tags[0]}
              </span>
            )}
          </a>
        </li>
      ))}
    </ul>
  )
}

// ─── Cards layout ─────────────────────────────────────────────────────────────

function CardsLayout({ bookmarks, theme, showFavicons, showDescriptions, showTags }: PortableGridProps) {
  const isDark = theme === 'dark'
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {bookmarks.map((bm) => (
        <a
          key={bm.id}
          href={bm.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'group flex flex-col gap-2 rounded-xl border p-4 transition-colors',
            isDark
              ? 'border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
              : 'border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50',
          )}
        >
          <div className="flex items-start gap-2">
            {showFavicons && (
              <DomainFavicon domain={bm.domain} faviconUrl={bm.favicon_url} size={16} />
            )}
            <span className={cn('min-w-0 flex-1 truncate text-sm font-medium', isDark ? 'text-neutral-100' : 'text-neutral-900')}>
              {bm.title}
            </span>
          </div>

          {showDescriptions && bm.description && (
            <p className={cn('line-clamp-2 text-xs leading-relaxed', isDark ? 'text-neutral-400' : 'text-neutral-500')}>
              {bm.description}
            </p>
          )}

          <div className="mt-auto flex items-center justify-between gap-2">
            <span className={cn('truncate text-xs', isDark ? 'text-neutral-500' : 'text-neutral-400')}>
              {bm.domain}
            </span>
            {showTags && bm.tags.length > 0 && (
              <div className="flex shrink-0 gap-1">
                {bm.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px]',
                      isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-500',
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </a>
      ))}
    </div>
  )
}

// ─── Masonry layout ───────────────────────────────────────────────────────────

function MasonryLayout({ bookmarks, theme, showFavicons, showDescriptions, showTags }: PortableGridProps) {
  const isDark = theme === 'dark'
  return (
    <div className="columns-1 gap-3 sm:columns-2 lg:columns-3">
      {bookmarks.map((bm) => (
        <a
          key={bm.id}
          href={bm.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'mb-3 flex break-inside-avoid flex-col gap-2 rounded-xl border p-4 transition-colors',
            isDark
              ? 'border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
              : 'border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50',
          )}
        >
          <div className="flex items-start gap-2">
            {showFavicons && (
              <DomainFavicon domain={bm.domain} faviconUrl={bm.favicon_url} size={16} />
            )}
            <span className={cn('text-sm font-medium leading-snug', isDark ? 'text-neutral-100' : 'text-neutral-900')}>
              {bm.title}
            </span>
          </div>

          {showDescriptions && bm.description && (
            <p className={cn('text-xs leading-relaxed', isDark ? 'text-neutral-400' : 'text-neutral-500')}>
              {bm.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn('text-xs', isDark ? 'text-neutral-500' : 'text-neutral-400')}>
              {bm.domain}
            </span>
            {showTags && bm.tags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px]',
                  isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-500',
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        </a>
      ))}
    </div>
  )
}

// ─── Terminal layout ──────────────────────────────────────────────────────────

function TerminalLayout({ bookmarks, showTags }: Pick<PortableGridProps, 'bookmarks' | 'showTags'>) {
  return (
    <div className="rounded-xl bg-neutral-950 p-6 font-mono text-sm text-green-400">
      <div className="mb-4 flex items-center gap-2 text-neutral-500">
        <span className="text-xs">stacked://bookmarks</span>
        <span className="ml-auto text-xs">{bookmarks.length} entries</span>
      </div>
      <ul className="space-y-1">
        {bookmarks.map((bm, i) => (
          <li key={bm.id} className="flex items-start gap-3">
            <span className="shrink-0 text-neutral-600 select-none">
              {String(i + 1).padStart(2, '0')}
            </span>
            <a
              href={bm.url}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 flex-1 hover:text-green-300 hover:underline"
            >
              <span className="text-green-300">[</span>
              <span className="truncate">{bm.title}</span>
              <span className="text-green-300">]</span>
              <span className="ml-2 text-neutral-500">{bm.domain}</span>
              {showTags && bm.tags.length > 0 && (
                <span className="ml-2 text-neutral-600">{bm.tags.join(' ')}</span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function PortableGrid(props: PortableGridProps) {
  const { bookmarks, layout, theme, showFavicons, showDescriptions, showTags } = props

  if (bookmarks.length === 0) {
    return (
      <p className={cn('py-16 text-center text-sm', theme === 'dark' ? 'text-neutral-500' : 'text-neutral-400')}>
        No bookmarks in this collection.
      </p>
    )
  }

  if (layout === 'terminal') {
    return <TerminalLayout bookmarks={bookmarks} showTags={showTags} />
  }

  if (layout === 'masonry') {
    return <MasonryLayout {...props} />
  }

  if (layout === 'cards') {
    return <CardsLayout {...props} />
  }

  // minimal
  return <MinimalLayout bookmarks={bookmarks} theme={theme} showFavicons={showFavicons} showTags={showTags} />
}
