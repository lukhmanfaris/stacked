'use client'

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Category } from '@/types/category'

interface CategoryBadgeProps {
  category: Pick<Category, 'name' | 'color'>
  onRemove?: () => void
  className?: string
}

export function CategoryBadge({ category, onRemove, className }: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        className,
      )}
      style={{ backgroundColor: category.color + '22', color: category.color }}
    >
      {category.name}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 rounded-full hover:opacity-70 focus:outline-none"
          aria-label={`Remove ${category.name}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}
