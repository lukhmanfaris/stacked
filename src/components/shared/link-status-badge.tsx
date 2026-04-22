import { cn } from '@/lib/utils'
import type { LinkStatus } from '@/types/bookmark'

interface LinkStatusBadgeProps {
  status: LinkStatus
  lastCheckedAt?: string | null
  className?: string
}

const STATUS_CONFIG: Record<
  LinkStatus,
  { dot: string; label: string }
> = {
  alive:      { dot: 'bg-green-500',                    label: 'Alive' },
  dead:       { dot: 'bg-red-500',                      label: 'Dead' },
  redirected: { dot: 'bg-amber-400',                    label: 'Redirected' },
  timeout:    { dot: 'bg-[var(--nd-text-disabled)]',    label: 'Timed out' },
  unchecked:  { dot: 'bg-[var(--nd-border-visible)]',   label: 'Not checked' },
}

function formatChecked(iso: string | null | undefined): string {
  if (!iso) return 'Never checked'
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Checked today'
  if (days === 1) return 'Checked yesterday'
  return `Checked ${days}d ago`
}

export function LinkStatusBadge({
  status,
  lastCheckedAt,
  className,
}: LinkStatusBadgeProps) {
  const { dot, label } = STATUS_CONFIG[status] ?? STATUS_CONFIG.unchecked
  const checkedText = formatChecked(lastCheckedAt)

  return (
    <span
      className={cn('group relative inline-flex items-center', className)}
      aria-label={`${label} · ${checkedText}`}
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', dot)} />

      {/* Hover tooltip */}
      <span
        className={cn(
          'pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2',
          'whitespace-nowrap rounded-[4px] border border-[var(--nd-border-visible)]',
          'bg-[var(--nd-surface)] px-2 py-1',
          'font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--nd-text-secondary)]',
          'opacity-0 transition-opacity group-hover:opacity-100',
          'z-50',
        )}
        role="tooltip"
      >
        {label} · {checkedText}
      </span>
    </span>
  )
}
