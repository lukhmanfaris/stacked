'use client'

import type React from 'react'
import { cn } from '@/lib/utils'

function Shimmer({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      style={style}
    />
  )
}

export function BookmarkCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3 rounded-xl border bg-card p-4', className)}>
      <div className="flex items-center gap-2">
        <Shimmer className="size-4 shrink-0 rounded-sm" />
        <Shimmer className="h-4 w-3/4" />
      </div>
      <Shimmer className="h-32 w-full rounded-lg" />
      <Shimmer className="h-3 w-full" />
      <Shimmer className="h-3 w-2/3" />
      <div className="flex gap-1.5">
        <Shimmer className="h-5 w-14 rounded-full" />
        <Shimmer className="h-5 w-10 rounded-full" />
      </div>
    </div>
  )
}

export function BookmarkListItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 rounded-lg border bg-card px-4 py-3', className)}>
      <Shimmer className="size-4 shrink-0 rounded-sm" />
      <Shimmer className="h-4 flex-1" />
      <Shimmer className="h-4 w-24" />
      <div className="flex gap-1.5">
        <Shimmer className="h-5 w-12 rounded-full" />
        <Shimmer className="h-5 w-10 rounded-full" />
      </div>
    </div>
  )
}

export function BookmarkStackSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative h-48 w-full', className)}>
      <Shimmer className="absolute inset-0 rounded-xl" style={{ transform: 'rotate(2deg)' }} />
      <Shimmer className="absolute inset-0 rounded-xl" style={{ transform: 'rotate(-1deg)' }} />
      <Shimmer className="absolute inset-0 rounded-xl" />
      <div className="absolute inset-x-4 bottom-4 flex items-center justify-between">
        <Shimmer className="h-4 w-24" />
        <Shimmer className="h-5 w-12 rounded-full" />
      </div>
    </div>
  )
}
