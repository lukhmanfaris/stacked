'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ParsedBookmark } from '@/lib/import/types'
import type { Category } from '@/types/category'

export type DuplicateStrategy = 'skip' | 'overwrite' | 'create_new'

interface Props {
  bookmarks: ParsedBookmark[]
  folders: string[]
  duplicateCount: number
  categories: Category[]
  selected: Set<number>
  onToggle: (idx: number) => void
  onToggleAll: (all: boolean) => void
  folderMap: Record<string, string | null>
  onFolderMapChange: (folder: string, categoryId: string | null) => void
  duplicateStrategy: DuplicateStrategy
  onDuplicateStrategyChange: (s: DuplicateStrategy) => void
}

export function ImportPreview({
  bookmarks,
  folders,
  duplicateCount,
  categories,
  selected,
  onToggle,
  onToggleAll,
  folderMap,
  onFolderMapChange,
  duplicateStrategy,
  onDuplicateStrategyChange,
}: Props) {
  const allSelected = selected.size === bookmarks.length
  const someSelected = selected.size > 0 && !allSelected

  return (
    <div className="space-y-6">
      {/* Folder → Category mapping */}
      {folders.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Map folders to categories</h3>
          <div className="divide-y divide-border rounded-lg border">
            {folders.map(folder => (
              <div key={folder} className="flex items-center gap-3 px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm">{folder}</span>
                <Select
                  value={folderMap[folder] ?? '__new__'}
                  onValueChange={val =>
                    onFolderMapChange(folder, val === '__new__' ? null : val)
                  }
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__new__">Create new category</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Duplicate strategy */}
      {duplicateCount > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            {duplicateCount} duplicate URL{duplicateCount !== 1 ? 's' : ''} found
          </h3>
          <div className="flex flex-wrap gap-3">
            {(
              [
                { value: 'skip', label: 'Skip duplicates' },
                { value: 'overwrite', label: 'Overwrite existing' },
                { value: 'create_new', label: 'Import anyway' },
              ] as { value: DuplicateStrategy; label: string }[]
            ).map(opt => (
              <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="duplicate_strategy"
                  value={opt.value}
                  checked={duplicateStrategy === opt.value}
                  onChange={() => onDuplicateStrategyChange(opt.value)}
                  className="accent-primary"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Bookmark table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">
            Bookmarks ({selected.size} of {bookmarks.length} selected)
          </h3>
          <button
            type="button"
            onClick={() => onToggleAll(!allSelected)}
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
              <tr>
                <th className="w-8 py-2 pl-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => {
                      if (el) el.indeterminate = someSelected
                    }}
                    onChange={e => onToggleAll(e.target.checked)}
                    className="accent-primary"
                  />
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Title</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Folder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookmarks.map((bm, idx) => (
                <tr
                  key={idx}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => onToggle(idx)}
                >
                  <td className="py-2 pl-3">
                    <input
                      type="checkbox"
                      checked={selected.has(idx)}
                      onChange={() => onToggle(idx)}
                      onClick={e => e.stopPropagation()}
                      className="accent-primary"
                    />
                  </td>
                  <td className="max-w-0 px-3 py-2">
                    <p className="truncate font-medium">{bm.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{bm.url}</p>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {bm.folder ?? <span className="italic">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
