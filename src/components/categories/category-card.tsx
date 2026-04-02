'use client'

import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { CategoryTree } from '@/types/category'

interface CategoryCardProps {
  category: CategoryTree
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
  className?: string
}

export function CategoryCard({ category, onClick, onEdit, onDelete, className }: CategoryCardProps) {
  return (
    <div
      className={cn(
        'group relative flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm',
        className,
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick?.() }}
    >
      {/* Color accent bar */}
      <div
        className="mt-0.5 h-full w-1 min-h-[40px] flex-none rounded-full"
        style={{ backgroundColor: category.color }}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-sm">{category.name}</span>
          {category.is_default && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              Default
            </span>
          )}
        </div>

        {category.description && (
          <p className="truncate text-xs text-muted-foreground">{category.description}</p>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{category.bookmark_count} bookmark{category.bookmark_count !== 1 ? 's' : ''}</span>
          {category.children.length > 0 && (
            <span>· {category.children.length} sub-categor{category.children.length !== 1 ? 'ies' : 'y'}</span>
          )}
        </div>
      </div>

      {/* Context menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          onClick={e => e.stopPropagation()}
          className="flex h-7 w-7 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
          aria-label="Category options"
        >
          <MoreVertical className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
          {onEdit && (
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          )}
          {onDelete && !category.is_default && (
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
