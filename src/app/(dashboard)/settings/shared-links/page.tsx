'use client'

import { useState } from 'react'
import { Share2, Plus, Copy, ExternalLink, Trash2, Eye, Pencil, Check, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useSharedLinks } from '@/hooks/use-shared-links'
import { useCategories } from '@/hooks/use-categories'
import { generateSlug } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { SharedLink, SharedLinkFormData, SharedLinkLayout, SharedLinkTheme } from '@/types/shared-link'
import { useEffect } from 'react'

// ─── Form panel ───────────────────────────────────────────────────────────────

interface FormPanelProps {
  initial?: SharedLink
  categories: { id: string; name: string }[]
  onClose: () => void
  onSave: (data: SharedLinkFormData) => Promise<void>
  isSaving: boolean
}

function FormPanel({ initial, categories, onClose, onSave, isSaving }: FormPanelProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [slugManual, setSlugManual] = useState(!!initial?.slug)
  const [layout, setLayout] = useState<SharedLinkLayout>(initial?.layout ?? 'cards')
  const [theme, setTheme] = useState<SharedLinkTheme>(initial?.theme ?? 'light')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(initial?.category_ids ?? [])
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)
  const [showFavicons, setShowFavicons] = useState(initial?.show_favicons ?? true)
  const [showDescriptions, setShowDescriptions] = useState(initial?.show_descriptions ?? true)
  const [showTags, setShowTags] = useState(initial?.show_tags ?? true)

  useEffect(() => {
    if (!slugManual && title) setSlug(generateSlug(title))
  }, [title, slugManual])

  function toggleCategory(id: string) {
    setSelectedCategoryIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id],
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSave({
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      slug: slug.trim() || undefined,
      layout,
      theme,
      category_ids: selectedCategoryIds,
      is_active: isActive,
      show_favicons: showFavicons,
      show_descriptions: showDescriptions,
      show_tags: showTags,
    })
  }

  const LAYOUTS: { value: SharedLinkLayout; label: string; desc: string }[] = [
    { value: 'minimal', label: 'Minimal', desc: 'Simple list' },
    { value: 'cards', label: 'Cards', desc: 'Grid of cards' },
    { value: 'masonry', label: 'Masonry', desc: 'Variable height' },
    { value: 'terminal', label: 'Terminal', desc: 'Monospace dark' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto bg-background shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="nd-label text-[var(--nd-text-primary)]">
            {initial ? 'Edit link' : 'New shared link'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[var(--nd-text-secondary)] hover:bg-[var(--nd-surface-raised)] hover:text-[var(--nd-text-primary)]"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6 px-6 py-6">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sl-title" className="nd-label text-[var(--nd-text-secondary)]">Title</Label>
            <Input id="sl-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="My bookmarks" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sl-desc" className="nd-label text-[var(--nd-text-secondary)]">Description</Label>
            <Textarea
              id="sl-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="A curated collection of useful links"
              rows={2}
              className="resize-none bg-transparent border-b border-[var(--nd-border-visible)] px-0 py-2 font-mono text-sm text-[var(--nd-text-primary)] placeholder:text-[var(--nd-text-disabled)] outline-none focus-visible:border-b-[var(--nd-text-primary)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sl-slug" className="nd-label text-[var(--nd-text-secondary)]">Slug</Label>
            <Input
              id="sl-slug"
              value={slug}
              onChange={e => { setSlugManual(true); setSlug(e.target.value) }}
              placeholder="my-collection"
            />
            <p className="font-mono text-[10px] text-[var(--nd-text-disabled)]">/p/{slug || '…'}</p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="nd-label text-[var(--nd-text-secondary)]">Layout</span>
            <div className="grid grid-cols-2 gap-2">
              {LAYOUTS.map(l => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setLayout(l.value)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-left transition-colors',
                    layout === l.value
                      ? 'border-[var(--nd-text-primary)] bg-[var(--nd-surface-raised)]'
                      : 'border-[var(--nd-border-subtle)] hover:border-[var(--nd-border-visible)]',
                  )}
                >
                  <p className="nd-label text-[11px] text-[var(--nd-text-primary)]">{l.label}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-[var(--nd-text-disabled)]">{l.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="nd-label text-[var(--nd-text-secondary)]">Theme</span>
            <div className="flex gap-2">
              {(['light', 'dark'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 transition-colors',
                    theme === t
                      ? 'border-[var(--nd-text-primary)] bg-[var(--nd-surface-raised)]'
                      : 'border-[var(--nd-border-subtle)] hover:border-[var(--nd-border-visible)]',
                  )}
                >
                  <span className="nd-label text-[11px] capitalize text-[var(--nd-text-primary)]">{t}</span>
                </button>
              ))}
            </div>
          </div>

          {categories.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="nd-label text-[var(--nd-text-secondary)]">
                Categories{' '}
                <span className="font-sans font-normal normal-case text-[var(--nd-text-disabled)]">
                  (empty = all bookmarks)
                </span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={cn(
                      'rounded-full border px-3 py-1 font-mono text-[11px] transition-colors',
                      selectedCategoryIds.includes(cat.id)
                        ? 'border-[var(--nd-text-primary)] bg-[var(--nd-text-primary)] text-[var(--nd-surface)]'
                        : 'border-[var(--nd-border-visible)] text-[var(--nd-text-secondary)] hover:border-[var(--nd-text-primary)]',
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <span className="nd-label text-[var(--nd-text-secondary)]">Options</span>
            {([
              { label: 'Show favicons', value: showFavicons, set: setShowFavicons },
              { label: 'Show descriptions', value: showDescriptions, set: setShowDescriptions },
              { label: 'Show tags', value: showTags, set: setShowTags },
              { label: 'Active (publicly accessible)', value: isActive, set: setIsActive },
            ] as const).map(opt => (
              <div key={opt.label} className="flex items-center justify-between gap-3">
                <span className="text-sm text-[var(--nd-text-primary)]">{opt.label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={opt.value}
                  onClick={() => (opt.set as (v: boolean) => void)(!opt.value)}
                  className={cn(
                    'relative h-5 w-9 rounded-full transition-colors',
                    opt.value ? 'bg-[var(--nd-text-display)]' : 'bg-[var(--nd-border-visible)]',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform',
                      opt.value ? 'translate-x-4' : 'translate-x-0.5',
                    )}
                  />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-auto flex gap-3 pt-4">
            <Button type="button" variant="secondary" size="sm" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSaving} className="flex-1">
              {isSaving && <Loader2 className="size-3 animate-spin" />}
              {initial ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Link card ────────────────────────────────────────────────────────────────

interface LinkCardProps {
  link: SharedLink
  onEdit: (link: SharedLink) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string, active: boolean) => void
  isDeleting: boolean
}

function LinkCard({ link, onEdit, onDelete, onToggleActive, isDeleting }: LinkCardProps) {
  const [copied, setCopied] = useState(false)

  function copyUrl() {
    const url = `${window.location.origin}/p/${link.slug}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className={cn(
      'flex flex-col gap-3 rounded-xl border p-4 transition-opacity',
      !link.is_active && 'opacity-50',
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="nd-label text-sm text-[var(--nd-text-primary)]">
            {link.title ?? 'Untitled collection'}
          </p>
          {link.description && (
            <p className="mt-0.5 line-clamp-1 text-xs text-[var(--nd-text-secondary)]">
              {link.description}
            </p>
          )}
          <div className="mt-1.5 flex items-center gap-2">
            <span className="font-mono text-[10px] text-[var(--nd-text-disabled)]">/p/{link.slug}</span>
            <span className={cn(
              'rounded-full border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest',
              link.is_active
                ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'border-[var(--nd-border-subtle)] text-[var(--nd-text-disabled)]',
            )}>
              {link.is_active ? 'live' : 'off'}
            </span>
            <span className="rounded-full border border-[var(--nd-border-subtle)] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[var(--nd-text-disabled)]">
              {link.layout}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={copyUrl}
            title="Copy URL"
            className="rounded-md p-1.5 text-[var(--nd-text-secondary)] hover:bg-[var(--nd-surface-raised)] hover:text-[var(--nd-text-primary)]"
          >
            {copied ? <Check className="size-3.5 text-green-600" /> : <Copy className="size-3.5" />}
          </button>
          <a
            href={`/p/${link.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open public page"
            className="rounded-md p-1.5 text-[var(--nd-text-secondary)] hover:bg-[var(--nd-surface-raised)] hover:text-[var(--nd-text-primary)]"
          >
            <ExternalLink className="size-3.5" />
          </a>
          <button
            type="button"
            onClick={() => onEdit(link)}
            title="Edit"
            className="rounded-md p-1.5 text-[var(--nd-text-secondary)] hover:bg-[var(--nd-surface-raised)] hover:text-[var(--nd-text-primary)]"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(link.id)}
            disabled={isDeleting}
            title="Delete"
            className="rounded-md p-1.5 text-[var(--nd-text-secondary)] hover:bg-[var(--nd-surface-raised)] hover:text-red-500"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--nd-border-subtle)' }}>
        <span className="flex items-center gap-1.5 text-[10px] text-[var(--nd-text-disabled)]">
          <Eye className="size-3" />
          {link.view_count.toLocaleString()} views
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={link.is_active}
          onClick={() => onToggleActive(link.id, !link.is_active)}
          title={link.is_active ? 'Deactivate' : 'Activate'}
          className={cn(
            'relative h-4 w-7 rounded-full transition-colors',
            link.is_active ? 'bg-[var(--nd-text-display)]' : 'bg-[var(--nd-border-visible)]',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 size-3 rounded-full bg-white shadow transition-transform',
              link.is_active ? 'translate-x-3.5' : 'translate-x-0.5',
            )}
          />
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SharedLinksPage() {
  const { links, isLoading, createLink, updateLink, deleteLink, isCreating, isUpdating, isDeleting } =
    useSharedLinks()
  const { flatCategories } = useCategories()
  const [formTarget, setFormTarget] = useState<SharedLink | 'new' | null>(null)

  const cats = flatCategories.map(c => ({ id: c.id, name: c.name }))

  async function handleSave(data: SharedLinkFormData) {
    try {
      if (formTarget === 'new') {
        await createLink(data)
        toast.success('Shared link created')
      } else if (formTarget) {
        await updateLink(formTarget.id, data)
        toast.success('Shared link updated')
      }
      setFormTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this shared link? This cannot be undone.')) return
    try {
      await deleteLink(id)
      toast.success('Deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  async function handleToggleActive(id: string, active: boolean) {
    try {
      await updateLink(id, { is_active: active })
    } catch {
      toast.error('Failed to update')
    }
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">Shared Links</h1>
            <p className="text-sm text-muted-foreground">
              Publish bookmark collections with a public URL.
            </p>
          </div>
          <Button size="sm" onClick={() => setFormTarget('new')}>
            <Plus className="size-3.5" />
            New
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map(i => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-[var(--nd-surface-raised)]" />
            ))}
          </div>
        ) : links.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Share2 className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="nd-label text-[var(--nd-text-primary)]">No shared links yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Create a link to share a public collection of your bookmarks.
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setFormTarget('new')}>
              Create first link
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {links.map(link => (
              <LinkCard
                key={link.id}
                link={link}
                onEdit={setFormTarget}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                isDeleting={isDeleting}
              />
            ))}
          </div>
        )}
      </div>

      {formTarget !== null && (
        <FormPanel
          initial={formTarget === 'new' ? undefined : formTarget}
          categories={cats}
          onClose={() => setFormTarget(null)}
          onSave={handleSave}
          isSaving={isCreating || isUpdating}
        />
      )}
    </>
  )
}
