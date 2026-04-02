'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { BookOpen, Pin, Archive, Plus, X, PanelLeftClose } from 'lucide-react'
import { CategoryTree } from '@/components/categories/category-tree'
import { CategoryForm } from '@/components/categories/category-form'
import { useCategories } from '@/hooks/use-categories'
import { useDashboard } from '@/contexts/dashboard-context'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CategoryFormData } from '@/types/category'

const SIDEBAR_WIDTH_KEY = 'stacked:sidebar-width'
const MIN_WIDTH = 200
const MAX_WIDTH = 320
const DEFAULT_WIDTH = 240

interface QuickFilter {
  label: string
  icon: React.ElementType
  filter?: string
}

const QUICK_FILTERS: QuickFilter[] = [
  { label: 'All Bookmarks', icon: BookOpen },
  { label: 'Pinned', icon: Pin, filter: 'pinned' },
  { label: 'Archived', icon: Archive, filter: 'archived' },
]

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { sidebarOpen, setSidebarOpen } = useDashboard()
  const { categories, reorderCategories, addCategory, flatCategories } = useCategories()

  const activeCategoryId = searchParams.get('category') ?? undefined
  const activeFilter = searchParams.get('filter') ?? undefined

  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH)

  const dragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(DEFAULT_WIDTH)

  useEffect(() => {
    const stored = parseInt(localStorage.getItem(SIDEBAR_WIDTH_KEY) ?? '', 10)
    if (!isNaN(stored)) {
      setSidebarWidth(Math.min(Math.max(stored, MIN_WIDTH), MAX_WIDTH))
    }
  }, [])

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!dragging.current) return
      const delta = e.clientX - startX.current
      const next = Math.min(Math.max(startWidth.current + delta, MIN_WIDTH), MAX_WIDTH)
      setSidebarWidth(next)
    }
    function onUp() {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      setSidebarWidth(w => {
        localStorage.setItem(SIDEBAR_WIDTH_KEY, String(w))
        return w
      })
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [])

  function onDragStart(e: React.PointerEvent) {
    dragging.current = true
    startX.current = e.clientX
    startWidth.current = sidebarWidth
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
  }

  async function handleAddCategory(data: CategoryFormData) {
    await addCategory(data)
    setShowCategoryForm(false)
  }

  function buildFilterHref(filter?: string) {
    if (!filter) return '/dashboard'
    return `/dashboard?filter=${filter}`
  }

  function isQuickFilterActive(filter?: string) {
    if (filter) return activeFilter === filter && !activeCategoryId
    return !activeFilter && !activeCategoryId && pathname === '/dashboard'
  }

  function handleCategorySelect(id: string) {
    router.push(`/dashboard?category=${id}`)
    if (window.innerWidth < 1024) setSidebarOpen(false)
  }

  function closeMobile() {
    setSidebarOpen(false)
  }

  const navContent = (
    <div className="flex h-full flex-col overflow-y-auto p-2">
      {/* Quick filters */}
      <div className="mb-2 flex flex-col gap-0.5">
        {QUICK_FILTERS.map(item => {
          const Icon = item.icon
          const isActive = isQuickFilterActive(item.filter)
          return (
            <Link
              key={item.label}
              href={buildFilterHref(item.filter)}
              onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false) }}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                isActive
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="size-4 flex-none" />
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* Categories header */}
      <div className="mb-1 flex items-center justify-between px-2 py-1">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Categories
        </span>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setShowCategoryForm(prev => !prev)}
          aria-label="Add category"
        >
          <Plus className="size-3" />
        </Button>
      </div>

      {/* Inline category form */}
      {showCategoryForm && (
        <div className="mb-2 rounded-lg border bg-card p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">New Category</span>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setShowCategoryForm(false)}
              aria-label="Cancel"
            >
              <X className="size-3" />
            </Button>
          </div>
          <CategoryForm
            onSubmit={handleAddCategory}
            parentOptions={flatCategories.map(c => ({ id: c.id, name: c.name }))}
          />
        </div>
      )}

      {/* Category tree */}
      <CategoryTree
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelect={handleCategorySelect}
        onReorder={items => reorderCategories(items)}
      />
    </div>
  )

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside
        className="relative hidden shrink-0 border-r bg-background lg:flex lg:flex-col"
        style={{
          width: sidebarOpen ? sidebarWidth : 0,
          transition: 'width 200ms ease',
          overflow: sidebarOpen ? 'visible' : 'hidden',
        }}
      >
        {sidebarOpen && (
          <>
            {/* Header */}
            <div className="flex h-14 shrink-0 items-center justify-between border-b px-3">
              <span className="text-sm font-semibold tracking-tight">Stacked</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <PanelLeftClose className="size-4" />
              </Button>
            </div>

            {/* Nav */}
            <div className="min-h-0 flex-1">{navContent}</div>

            {/* Resize handle */}
            <div
              className="absolute inset-y-0 right-0 w-1 cursor-col-resize opacity-0 hover:opacity-100 hover:bg-border active:bg-primary/30 transition-opacity"
              onPointerDown={onDragStart}
            />
          </>
        )}
      </aside>

      {/* ── Mobile drawer ────────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeMobile}
          />
          {/* Drawer */}
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-background shadow-xl">
            <div className="flex h-14 shrink-0 items-center justify-between border-b px-3">
              <span className="text-sm font-semibold tracking-tight">Stacked</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeMobile}
                aria-label="Close sidebar"
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="min-h-0 flex-1">{navContent}</div>
          </aside>
        </div>
      )}
    </>
  )
}
