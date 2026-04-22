import { Eye } from 'lucide-react'
import type { SharedLinkTheme } from '@/types/shared-link'
import { cn } from '@/lib/utils'

interface PortableHeaderProps {
  title: string | null
  description: string | null
  viewCount: number
  linkCount: number
  theme: SharedLinkTheme
}

export function PortableHeader({ title, description, viewCount, linkCount, theme }: PortableHeaderProps) {
  const isDark = theme === 'dark'

  return (
    <header className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-3">
        <h1
          className={cn(
            'text-2xl font-semibold tracking-tight sm:text-3xl',
            isDark ? 'text-neutral-50' : 'text-neutral-900',
          )}
        >
          {title ?? 'Bookmarks'}
        </h1>

        {description && (
          <p className={cn('text-sm', isDark ? 'text-neutral-400' : 'text-neutral-500')}>
            {description}
          </p>
        )}

        <div className="flex items-center gap-4">
          <span className={cn('text-xs', isDark ? 'text-neutral-500' : 'text-neutral-400')}>
            {linkCount} {linkCount === 1 ? 'link' : 'links'}
          </span>
          <span className={cn('flex items-center gap-1 text-xs', isDark ? 'text-neutral-500' : 'text-neutral-400')}>
            <Eye className="size-3" aria-hidden="true" />
            {viewCount.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="mt-8 border-t" style={{ borderColor: isDark ? '#262626' : '#e5e7eb' }} />
    </header>
  )
}
