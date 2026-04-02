'use client'

import { useState, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Upload, FileText, Braces, Table2, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ImportPreview, type DuplicateStrategy } from './import-preview'
import { useCategories } from '@/hooks/use-categories'
import type { ParsedBookmark } from '@/lib/import/types'

type Format = 'html' | 'json' | 'csv'
type Step = 'format' | 'upload' | 'preview' | 'done'

interface PreviewData {
  bookmarks: ParsedBookmark[]
  folders: string[]
  duplicate_count: number
}

interface ImportResult {
  imported: number
  skipped: number
  failed: number
}

const FORMAT_OPTIONS: { value: Format; label: string; desc: string; icon: React.ElementType }[] = [
  {
    value: 'html',
    label: 'Browser HTML',
    desc: 'Chrome, Firefox, Safari, or Edge bookmark export',
    icon: FileText,
  },
  {
    value: 'json',
    label: 'Stacked JSON',
    desc: 'A previous export from Stacked',
    icon: Braces,
  },
  {
    value: 'csv',
    label: 'CSV',
    desc: 'Spreadsheet with url, title, category columns',
    icon: Table2,
  },
]

export function ImportWizard() {
  const [step, setStep] = useState<Step>('format')
  const [format, setFormat] = useState<Format>('html')
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [folderMap, setFolderMap] = useState<Record<string, string | null>>({})
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>('skip')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { flatCategories } = useCategories()
  const queryClient = useQueryClient()

  const handleFile = useCallback(async (file: File) => {
    setIsUploading(true)
    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch('/api/import/preview', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error?.message ?? 'Failed to parse file')
        return
      }

      const data: PreviewData = json.data
      setPreview(data)
      setSelected(new Set(data.bookmarks.map((_, i) => i)))

      // Default folder_map: null (auto-create) for each folder
      const map: Record<string, string | null> = {}
      for (const f of data.folders) map[f] = null
      setFolderMap(map)

      setStep('preview')
    } catch {
      toast.error('Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleImport = async () => {
    if (!preview) return
    setIsImporting(true)

    const selectedBookmarks = preview.bookmarks.filter((_, i) => selected.has(i))

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookmarks: selectedBookmarks,
          folder_map: folderMap,
          duplicate_strategy: duplicateStrategy,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error?.message ?? 'Import failed')
        return
      }

      setResult(json.data)
      setStep('done')
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    } catch {
      toast.error('Import failed. Please try again.')
    } finally {
      setIsImporting(false)
    }
  }

  // ── Step: Format ──────────────────────────────────────────────────────────
  if (step === 'format') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Choose the format of the file you want to import.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {FORMAT_OPTIONS.map(opt => {
            const Icon = opt.icon
            const active = format === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormat(opt.value)}
                className={`flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50 ${
                  active ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <Icon className={`size-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                <div>
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </button>
            )
          })}
        </div>
        <Button onClick={() => setStep('upload')}>Continue</Button>
      </div>
    )
  }

  // ── Step: Upload ──────────────────────────────────────────────────────────
  if (step === 'upload') {
    const accept =
      format === 'html' ? '.html,.htm' : format === 'json' ? '.json' : '.csv'

    return (
      <div className="space-y-4">
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={() => setStep('format')}
        >
          ← Back
        </button>

        <div
          className={`flex flex-col items-center gap-3 rounded-lg border-2 border-dashed p-10 transition-colors ${
            dragOver ? 'border-primary bg-primary/5' : 'border-border'
          }`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <Upload className="size-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">Drag & drop your file here</p>
            <p className="text-xs text-muted-foreground">or click to browse</p>
          </div>
          <Button
            variant="outline"
            disabled={isUploading}
            onClick={() => fileRef.current?.click()}
          >
            {isUploading ? 'Parsing…' : 'Browse file'}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
          <p className="text-xs text-muted-foreground">
            Accepted: {accept} · Max 10 MB
          </p>
        </div>
      </div>
    )
  }

  // ── Step: Preview ─────────────────────────────────────────────────────────
  if (step === 'preview' && preview) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={() => setStep('upload')}
        >
          ← Back
        </button>

        <ImportPreview
          bookmarks={preview.bookmarks}
          folders={preview.folders}
          duplicateCount={preview.duplicate_count}
          categories={flatCategories}
          selected={selected}
          onToggle={idx => {
            const next = new Set(selected)
            if (next.has(idx)) next.delete(idx)
            else next.add(idx)
            setSelected(next)
          }}
          onToggleAll={all => {
            if (all) setSelected(new Set(preview.bookmarks.map((_, i) => i)))
            else setSelected(new Set())
          }}
          folderMap={folderMap}
          onFolderMapChange={(folder, catId) =>
            setFolderMap(prev => ({ ...prev, [folder]: catId }))
          }
          duplicateStrategy={duplicateStrategy}
          onDuplicateStrategyChange={setDuplicateStrategy}
        />

        <Button
          disabled={selected.size === 0 || isImporting}
          onClick={handleImport}
        >
          {isImporting
            ? 'Importing…'
            : `Import ${selected.size} bookmark${selected.size !== 1 ? 's' : ''}`}
        </Button>
      </div>
    )
  }

  // ── Step: Done ────────────────────────────────────────────────────────────
  if (step === 'done' && result) {
    const hasFailures = result.failed > 0
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        {hasFailures ? (
          <AlertCircle className="size-10 text-destructive" />
        ) : (
          <CheckCircle2 className="size-10 text-green-500" />
        )}
        <div>
          <p className="text-lg font-semibold">Import complete</p>
          <p className="text-sm text-muted-foreground">
            {result.imported} imported
            {result.skipped > 0 ? `, ${result.skipped} skipped` : ''}
            {result.failed > 0 ? `, ${result.failed} failed` : ''}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => {
            setStep('format')
            setPreview(null)
            setResult(null)
          }}>
            Import more
          </Button>
          <Button render={<Link href="/dashboard" />}>
            Go to dashboard
          </Button>
        </div>
      </div>
    )
  }

  return null
}
