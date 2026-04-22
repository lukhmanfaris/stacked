'use client'

import { Bookmark, Heart, Folder, Tag } from 'lucide-react'
import { useBookmarkCounts } from '@/hooks/use-bookmark-counts'
import { useCategories } from '@/hooks/use-categories'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number
  icon: React.ElementType
  tint: { bg: string; fg: string }
}

function StatCard({ label, value, icon: Icon, tint }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-[12px] border border-[var(--nd-border)] bg-[var(--nd-surface)] p-4">
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-[10px]"
        style={{ backgroundColor: tint.bg, color: tint.fg }}
      >
        <Icon className="size-5" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="font-display text-[26px] font-bold leading-none tracking-[0.02em] text-[var(--nd-text-display)] tabular-nums">
          {value.toLocaleString()}
        </p>
        <p className="nd-label mt-1.5 text-[var(--nd-text-disabled)]">{label}</p>
      </div>
    </div>
  )
}

export function DashboardStats({ className }: { className?: string }) {
  const { counts } = useBookmarkCounts()
  const { categories } = useCategories()

  const collectionCount = categories.reduce(
    (sum, c) => sum + 1 + c.children.length,
    0,
  )
  const tagCount = Object.keys(counts.by_tag).length

  return (
    <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-4', className)}>
      <StatCard
        label="Total Bookmarks"
        value={counts.total}
        icon={Bookmark}
        tint={{ bg: 'rgba(0, 122, 255, 0.10)',  fg: '#0058B8' }}
      />
      <StatCard
        label="Favorites"
        value={counts.favorites}
        icon={Heart}
        tint={{ bg: 'rgba(215, 25, 33, 0.10)',  fg: '#A8141B' }}
      />
      <StatCard
        label="Collections"
        value={collectionCount}
        icon={Folder}
        tint={{ bg: 'rgba(74, 158, 92, 0.12)',  fg: '#357044' }}
      />
      <StatCard
        label="Tags"
        value={tagCount}
        icon={Tag}
        tint={{ bg: 'rgba(124, 58, 237, 0.10)', fg: '#5B26B8' }}
      />
    </div>
  )
}
