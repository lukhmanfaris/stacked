'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCategories } from '@/hooks/use-categories'

type ExportFormat = 'json' | 'html' | 'csv'

const FORMAT_LABELS: Record<ExportFormat, string> = {
  json: 'Stacked JSON (re-importable)',
  html: 'Browser HTML (Netscape format)',
  csv: 'CSV (spreadsheet)',
}

export function ExportOptions() {
  const [format, setFormat] = useState<ExportFormat>('json')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const { flatCategories, isLoading } = useCategories()

  const handleExport = () => {
    const params = new URLSearchParams({ format })
    if (selectedCategories.length > 0) {
      params.set('category_ids', selectedCategories.join(','))
    }
    window.location.href = `/api/export?${params.toString()}`
  }

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-5">
      {/* Format */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Format</label>
        <Select value={format} onValueChange={v => setFormat(v as ExportFormat)}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(FORMAT_LABELS) as [ExportFormat, string][]).map(([val, label]) => (
              <SelectItem key={val} value={val}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category filter */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Categories{' '}
          <span className="font-normal text-muted-foreground">(optional — leave empty for all)</span>
        </label>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {flatCategories.map(cat => {
              const active = selectedCategories.includes(cat.id)
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {cat.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <Button onClick={handleExport} className="gap-2">
        <Download className="size-4" />
        Download export
      </Button>
    </div>
  )
}
