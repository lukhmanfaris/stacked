'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronRight, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CategoryTree as CategoryTreeType, Category } from '@/types/category'

// ─── Single sortable item ──────────────────────────────────────────────────

interface SortableItemProps {
  category: CategoryTreeType
  isActive: boolean
  depth?: number
  onSelect: (id: string) => void
  counts?: Record<string, number>
  activeCategoryId?: string
}

function countFor(cat: { id: string; bookmark_count: number }, counts?: Record<string, number>) {
  return counts?.[cat.id] ?? cat.bookmark_count
}

function SortableItem({ category, isActive, depth = 0, onSelect, counts, activeCategoryId }: SortableItemProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = category.children.length > 0
  const count = countFor(category, counts)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <button
        type="button"
        onClick={() => onSelect(category.id)}
        className={cn(
          'group flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 transition-colors',
          isActive
            ? 'bg-[var(--nd-surface-raised)] text-[var(--nd-text-display)]'
            : 'text-[var(--nd-text-secondary)] hover:bg-[var(--nd-surface-raised)] hover:text-[var(--nd-text-primary)]',
          depth > 0 && 'ml-4',
        )}
      >
        {/* Drag handle */}
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab opacity-0 transition-opacity group-hover:opacity-40 active:cursor-grabbing"
          onClick={e => e.stopPropagation()}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </span>

        {/* Color dot */}
        <span
          className="h-2 w-2 flex-none rounded-full"
          style={{ backgroundColor: category.color }}
        />

        {/* Name */}
        <span className="flex-1 truncate text-left font-sans text-[13px]">{category.name}</span>

        {/* Count badge */}
        {count > 0 && (
          <span className="font-mono text-[10px] tabular-nums text-[var(--nd-text-disabled)]">
            {count}
          </span>
        )}

        {/* Expand/collapse */}
        {hasChildren && (
          <ChevronRight
            className={cn('h-3.5 w-3.5 flex-none transition-transform text-[var(--nd-text-disabled)]', expanded && 'rotate-90')}
            onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
          />
        )}
      </button>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="ml-2 border-l border-[var(--nd-border)] pl-2">
          {category.children.map((child: Category) => {
            const childCount = countFor(child, counts)
            const childActive = child.id === activeCategoryId
            return (
              <button
                key={child.id}
                type="button"
                onClick={() => onSelect(child.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 transition-colors',
                  childActive
                    ? 'bg-[var(--nd-surface-raised)] text-[var(--nd-text-display)]'
                    : 'text-[var(--nd-text-secondary)] hover:bg-[var(--nd-surface-raised)] hover:text-[var(--nd-text-primary)]',
                )}
              >
                <span
                  className="h-2 w-2 flex-none rounded-full"
                  style={{ backgroundColor: child.color }}
                />
                <span className="flex-1 truncate text-left font-sans text-[13px]">{child.name}</span>
                {childCount > 0 && (
                  <span className="font-mono text-[10px] tabular-nums text-[var(--nd-text-disabled)]">
                    {childCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Tree ──────────────────────────────────────────────────────────────────

interface CategoryTreeProps {
  categories: CategoryTreeType[]
  activeCategoryId?: string
  onSelect?: (id: string) => void
  onReorder?: (items: { id: string; sort_order: number }[]) => void
  /** Live counts keyed by category id; falls back to category.bookmark_count when missing */
  counts?: Record<string, number>
}

export function CategoryTree({
  categories,
  activeCategoryId,
  onSelect,
  onReorder,
  counts,
}: CategoryTreeProps) {
  const [items, setItems] = useState(categories)

  // Sync when prop changes
  if (
    categories.length !== items.length ||
    categories.some((c, i) => c.id !== items[i]?.id || c.updated_at !== items[i]?.updated_at)
  ) {
    setItems(categories)
  }

  const sensors = useSensors(useSensor(PointerSensor))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex(c => c.id === active.id)
    const newIndex = items.findIndex(c => c.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(items, oldIndex, newIndex)
    setItems(reordered)
    onReorder?.(reordered.map((c, i) => ({ id: c.id, sort_order: i })))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <nav className="space-y-0.5">
          {items.map(category => (
            <SortableItem
              key={category.id}
              category={category}
              isActive={category.id === activeCategoryId}
              activeCategoryId={activeCategoryId}
              onSelect={id => onSelect?.(id)}
              counts={counts}
            />
          ))}
        </nav>
      </SortableContext>
    </DndContext>
  )
}
