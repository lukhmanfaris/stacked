'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Pin, X, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Favicon } from '@/components/shared/favicon'
import { useCategories } from '@/hooks/use-categories'
import { bookmarkSchema } from '@/lib/validators'
import { cn } from '@/lib/utils'
import type { Bookmark, BookmarkFormData } from '@/types/bookmark'
import { z } from 'zod'

// Use input type so react-hook-form sees optional fields before zod defaults are applied
type FormValues = z.input<typeof bookmarkSchema>

interface MetadataPreview {
  title: string | null
  description: string | null
  favicon_url: string | null
  domain: string
}

interface BookmarkFormProps {
  /** Provide to enter Update mode. */
  defaultValues?: Partial<Bookmark>
  /** All existing tags across user's bookmarks, for autocomplete. */
  existingTags?: string[]
  onSubmit: (data: BookmarkFormData) => Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
}

export function BookmarkForm({
  defaultValues,
  existingTags = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
}: BookmarkFormProps) {
  const { flatCategories } = useCategories()
  const isEdit = !!defaultValues?.id

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(bookmarkSchema),
    defaultValues: {
      url: defaultValues?.url ?? '',
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      category_id: defaultValues?.category_id ?? flatCategories[0]?.id ?? '',
      tags: defaultValues?.tags ?? [],
      is_pinned: defaultValues?.is_pinned ?? false,
    },
  })

  const urlValue = watch('url')
  const titleValue = watch('title')
  const tagsValue = watch('tags') ?? []
  const isPinned = watch('is_pinned')

  // ─── Metadata fetch ────────────────────────────────────────────────────────

  const [fetchState, setFetchState] = useState<'idle' | 'loading' | 'done'>('idle')
  const [preview, setPreview] = useState<MetadataPreview | null>(
    defaultValues?.domain
      ? {
          title: defaultValues.title ?? null,
          description: defaultValues.description ?? null,
          favicon_url: defaultValues.favicon_url ?? null,
          domain: defaultValues.domain,
        }
      : null,
  )
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastFetchedUrl = useRef<string>('')

  useEffect(() => {
    if (isEdit) return // Don't auto-refetch in edit mode

    if (debounceRef.current) clearTimeout(debounceRef.current)

    let validUrl: URL | null = null
    try {
      validUrl = new URL(urlValue)
      if (validUrl.protocol !== 'http:' && validUrl.protocol !== 'https:') validUrl = null
    } catch {
      // invalid
    }

    if (!validUrl || urlValue === lastFetchedUrl.current) return

    debounceRef.current = setTimeout(async () => {
      lastFetchedUrl.current = urlValue
      setFetchState('loading')
      try {
        const res = await fetch('/api/metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlValue }),
        })
        const json = await res.json()
        if (res.ok && json.data) {
          const meta = json.data as MetadataPreview
          setPreview(meta)
          // Auto-fill only if user hasn't typed their own value
          if (!titleValue) setValue('title', meta.title ?? undefined)
          if (!watch('description')) setValue('description', meta.description ?? undefined)
        }
      } finally {
        setFetchState('done')
      }
    }, 600)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [urlValue]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Tag input ─────────────────────────────────────────────────────────────

  const [tagInput, setTagInput] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([])

  function handleTagInputChange(value: string) {
    setTagInput(value)
    if (value.trim()) {
      setTagSuggestions(
        existingTags
          .filter(t => t.toLowerCase().startsWith(value.toLowerCase()) && !tagsValue.includes(t))
          .slice(0, 5),
      )
    } else {
      setTagSuggestions([])
    }
  }

  function addTag(tag: string) {
    const trimmed = tag.trim().toLowerCase()
    if (!trimmed || tagsValue.includes(trimmed) || tagsValue.length >= 10) return
    setValue('tags', [...tagsValue, trimmed])
    setTagInput('')
    setTagSuggestions([])
  }

  function removeTag(tag: string) {
    setValue('tags', tagsValue.filter(t => t !== tag))
  }

  // ─── Keyboard submit (Cmd+Enter) ───────────────────────────────────────────

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit(submit)()
    }
  }

  async function submit(values: FormValues) {
    await onSubmit({
      url: values.url,
      title: values.title,
      description: values.description,
      category_id: values.category_id,
      tags: values.tags ?? [],
      is_pinned: values.is_pinned ?? false,
    })
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit(submit)}
      onKeyDown={handleKeyDown}
      className="flex flex-col gap-4"
    >
      {/* URL */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="url">URL</Label>
        <div className="relative">
          <Input
            id="url"
            type="url"
            placeholder="https://example.com"
            {...register('url')}
            aria-invalid={!!errors.url}
            disabled={isEdit}
          />
          {fetchState === 'loading' && (
            <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
        {errors.url && <p className="text-xs text-destructive">{errors.url.message}</p>}
      </div>

      {/* Metadata preview */}
      {preview && (
        <div className="flex items-center gap-2.5 rounded-lg border bg-muted/40 px-3 py-2.5">
          <Favicon domain={preview.domain} faviconUrl={preview.favicon_url} size={20} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{preview.title ?? preview.domain}</p>
            {preview.description && (
              <p className="line-clamp-1 text-xs text-muted-foreground">{preview.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Auto-filled from URL"
          {...register('title')}
          aria-invalid={!!errors.title}
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Textarea
          id="description"
          placeholder="Auto-filled from URL"
          rows={2}
          {...register('description')}
        />
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category">Category</Label>
        <Select
          value={watch('category_id')}
          onValueChange={v => { if (v) setValue('category_id', v) }}
        >
          <SelectTrigger id="category" className="w-full overflow-hidden" aria-invalid={!!errors.category_id}>
            <SelectValue className="truncate">
              {(() => {
                const selectedCat = flatCategories.find(c => c.id === watch('category_id'))
                if (!selectedCat) return <span className="text-muted-foreground">Select a category</span>
                return (
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="inline-block size-2 shrink-0 rounded-full" style={{ backgroundColor: selectedCat.color }} />
                    <span className="truncate">{selectedCat.name}</span>
                  </span>
                )
              })()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {flatCategories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                <span className="mr-1.5 inline-block size-2 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category_id && (
          <p className="text-xs text-destructive">{errors.category_id.message}</p>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-1.5">
        <Label>Tags <span className="text-muted-foreground font-normal">(up to 10)</span></Label>
        <div className="flex flex-wrap gap-1.5">
          {tagsValue.map(tag => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove tag ${tag}`}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}

          {tagsValue.length < 10 && (
            <div className="relative">
              <div className="flex items-center gap-1 rounded-full border bg-transparent px-2.5 py-1">
                <input
                  value={tagInput}
                  onChange={e => handleTagInputChange(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      addTag(tagInput)
                    }
                  }}
                  placeholder="Add tag…"
                  className="w-20 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                  maxLength={30}
                />
                {tagInput && (
                  <button
                    type="button"
                    onClick={() => addTag(tagInput)}
                    aria-label="Add tag"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="size-3" />
                  </button>
                )}
              </div>

              {/* Tag autocomplete */}
              {tagSuggestions.length > 0 && (
                <div className="absolute left-0 top-full z-10 mt-1 min-w-32 rounded-lg border bg-popover p-1 shadow-md">
                  {tagSuggestions.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addTag(s)}
                      className="w-full rounded-md px-2 py-1 text-left text-xs hover:bg-accent hover:text-accent-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pin toggle */}
      <label className="flex cursor-pointer items-center gap-2.5">
        <button
          type="button"
          role="switch"
          aria-checked={isPinned}
          onClick={() => setValue('is_pinned', !isPinned)}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors',
            isPinned ? 'bg-primary' : 'bg-muted',
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform',
              isPinned ? 'translate-x-4' : 'translate-x-0',
            )}
          />
        </button>
        <div className="flex items-center gap-1.5 text-sm">
          <Pin className={cn('size-3.5', isPinned ? 'fill-primary text-primary' : 'text-muted-foreground')} />
          Pin this bookmark
        </div>
      </label>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Cancel
          </button>
        )}
        <p className="text-xs text-muted-foreground">
          <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">⌘</kbd>
          {' + '}
          <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">↵</kbd>
          {' to save'}
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? 'Save changes' : 'Add bookmark'}
        </button>
      </div>
    </form>
  )
}
