'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CATEGORY_COLORS } from '@/lib/constants'

interface FaviconProps {
  /** Hostname, e.g. "github.com". Used for fallback color + initial. */
  domain: string
  /** Public CDN URL from bookmark.favicon_url. Pass null to show fallback immediately. */
  faviconUrl: string | null
  /** Size in px. Defaults to 16. */
  size?: 16 | 20 | 24 | 32
  className?: string
}

const SIZE_CLASS: Record<NonNullable<FaviconProps['size']>, string> = {
  16: 'size-4 text-[9px]',
  20: 'size-5 text-[10px]',
  24: 'size-6 text-xs',
  32: 'size-8 text-sm',
}

/** Deterministic color from domain string — same domain always maps to the same color. */
function domainColor(domain: string): string {
  let hash = 0
  for (let i = 0; i < domain.length; i++) {
    hash = (hash * 31 + domain.charCodeAt(i)) >>> 0
  }
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length]
}

export function Favicon({ domain, faviconUrl, size = 16, className }: FaviconProps) {
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>(
    faviconUrl ? 'loading' : 'error',
  )

  const sizeClass = SIZE_CLASS[size]
  const color = domainColor(domain)
  const initial = domain.replace(/^www\./, '')[0]?.toUpperCase() ?? '?'

  if (state !== 'error' && faviconUrl) {
    return (
      <img
        src={faviconUrl}
        width={size}
        height={size}
        alt=""
        aria-hidden="true"
        className={cn('rounded-sm object-contain', state === 'loading' && 'invisible', sizeClass, className)}
        onLoad={() => setState('loaded')}
        onError={() => setState('error')}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-sm font-semibold leading-none text-white',
        sizeClass,
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {initial}
    </span>
  )
}
