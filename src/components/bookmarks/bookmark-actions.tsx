'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Archive, ArchiveRestore, Pin, PinOff, FolderInput, X, CheckSquare } from 'lucide-react'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { useCategories } from '@/hooks/use-categories'
import { cn } from '@/lib/utils'
import type { BulkActionType } from '@/types/bookmark'

interface BookmarkActionsProps {
  selectedIds: string[]
  onAction: (ids: string[], action: BulkActionType) => Promise<void>
  onClearSelection: () => void
  onSelectAll: () => void
  className?: string
}

export function BookmarkActions({
  selectedIds,
  onAction,
  onClearSelection,
  onSelectAll,
  className,
}: BookmarkActionsProps) {
  const { flatCategories } = useCategories()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const count = selectedIds.length

  async function act(action: BulkActionType) {
    setIsPending(true)
    try {
      await onAction(selectedIds, action)
      onClearSelection()
    } finally {
      setIsPending(false)
      setConfirmDelete(false)
    }
  }

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          key="toolbar"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className={cn(
            'fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-2xl border bg-card/95 px-4 py-2.5 shadow-xl backdrop-blur-md',
            className,
          )}
        >
          {/* Count + select all */}
          <div className="flex items-center gap-2 pr-2 border-r">
            <span className="text-sm font-medium">{count} selected</span>
            <button
              type="button"
              onClick={onSelectAll}
              aria-label="Select all"
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <CheckSquare className="size-4" />
            </button>
            <button
              type="button"
              onClick={onClearSelection}
              aria-label="Clear selection"
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Move to category */}
          <Select
            onValueChange={catId => { if (typeof catId === 'string') act({ type: 'move', category_id: catId }) }}
          >
            <SelectTrigger
              className="h-8 gap-1.5 border-0 bg-transparent px-2 text-xs hover:bg-muted"
              aria-label="Move to category"
            >
              <FolderInput className="size-3.5" />
              <SelectValue placeholder="Move to…" />
            </SelectTrigger>
            <SelectContent>
              {flatCategories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  <span
                    className="mr-1.5 inline-block size-2 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Pin */}
          <ToolbarButton
            icon={<Pin className="size-3.5" />}
            label="Pin"
            onClick={() => act({ type: 'pin' })}
            disabled={isPending}
          />
          <ToolbarButton
            icon={<PinOff className="size-3.5" />}
            label="Unpin"
            onClick={() => act({ type: 'unpin' })}
            disabled={isPending}
          />

          {/* Archive */}
          <ToolbarButton
            icon={<Archive className="size-3.5" />}
            label="Archive"
            onClick={() => act({ type: 'archive' })}
            disabled={isPending}
          />
          <ToolbarButton
            icon={<ArchiveRestore className="size-3.5" />}
            label="Unarchive"
            onClick={() => act({ type: 'unarchive' })}
            disabled={isPending}
          />

          {/* Delete */}
          <div className="pl-2 border-l">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-destructive">Delete {count}?</span>
                <button
                  type="button"
                  onClick={() => act({ type: 'delete' })}
                  disabled={isPending}
                  className="rounded px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <ToolbarButton
                icon={<Trash2 className="size-3.5 text-destructive" />}
                label="Delete"
                onClick={() => setConfirmDelete(true)}
                disabled={isPending}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ToolbarButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
    >
      {icon}
      <span className="hidden sm:block">{label}</span>
    </button>
  )
}
