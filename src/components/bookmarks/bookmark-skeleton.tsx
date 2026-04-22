'use client'

import type React from 'react'
import { cn } from '@/lib/utils'

function Block({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn('bg-[var(--nd-surface-raised)]', className)}
      style={style}
    />
  )
}

export function BookmarkCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3 rounded-[12px] border border-[var(--nd-border)] bg-[var(--nd-surface)] p-4', className)}>
      <div className="flex items-center gap-2">
        <Block className="size-3.5 shrink-0" />
        <Block className="h-3.5 w-3/4" />
      </div>
      <Block className="h-28 w-full" />
      <Block className="h-2.5 w-full" />
      <Block className="h-2.5 w-2/3" />
      <div className="flex gap-1.5">
        <Block className="h-4 w-12" />
        <Block className="h-4 w-10" />
      </div>
    </div>
  )
}

export function BookmarkListItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 border-b border-[var(--nd-border)] bg-[var(--nd-surface)] px-4 py-3', className)}>
      <Block className="size-3.5 shrink-0" />
      <Block className="h-3.5 flex-1" />
      <Block className="h-3 w-20" />
      <div className="flex gap-1.5">
        <Block className="h-4 w-10" />
        <Block className="h-4 w-8" />
      </div>
    </div>
  )
}

export function BookmarkStackSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative h-40 w-full', className)}>
      <div className="absolute inset-x-2 top-2 h-full rounded-[12px] border border-[var(--nd-border)] bg-[var(--nd-surface-raised)]" style={{ transform: 'rotate(2.5deg)' }} />
      <div className="absolute inset-x-1 top-1 h-full rounded-[12px] border border-[var(--nd-border)] bg-[var(--nd-surface)]" style={{ transform: 'rotate(-1deg)' }} />
      <div className="absolute inset-0 flex flex-col justify-between rounded-[12px] border border-[var(--nd-border)] bg-[var(--nd-surface)] p-4">
        <Block className="h-3 w-24" />
        <Block className="h-3 w-16" />
      </div>
    </div>
  )
}
