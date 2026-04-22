'use client'

import { useEffect, useCallback } from 'react'
import { Command } from 'cmdk'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  BookmarkPlus,
  PanelLeftClose,
  LayoutGrid,
  List,
  Layers,
  LayoutDashboard,
  Settings,
  Upload,
  Share2,
  Sun,
  Moon,
  Monitor,
  Tag,
} from 'lucide-react'
import { useDashboard } from '@/contexts/dashboard-context'
import { useCategories } from '@/hooks/use-categories'

export function CommandPalette() {
  const router = useRouter()
  const { setTheme } = useTheme()
  const {
    paletteOpen,
    setPaletteOpen,
    setFormOpen,
    toggleSidebar,
    setViewMode,
  } = useDashboard()
  const { flatCategories } = useCategories()

  const close = useCallback(() => setPaletteOpen(false), [setPaletteOpen])

  const run = useCallback((fn: () => void) => {
    fn()
    close()
  }, [close])

  // Close on Escape (cmdk handles it via onKeyDown, but also catch at document level)
  useEffect(() => {
    if (!paletteOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [paletteOpen, close])

  if (!paletteOpen) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-black/80 pt-[20vh]"
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <Command
        className="w-full max-w-lg overflow-hidden rounded-[16px] border border-[var(--nd-border-visible)] bg-[var(--nd-surface)] shadow-2xl"
        loop
      >
        {/* Search input */}
        <div className="flex items-center border-b border-[var(--nd-border)] px-4">
          <Command.Input
            autoFocus
            placeholder="Type a command or search…"
            className="h-12 w-full bg-transparent font-sans text-sm text-[var(--nd-text-display)] placeholder:text-[var(--nd-text-disabled)] outline-none"
          />
          <kbd className="hidden shrink-0 rounded-[4px] border border-[var(--nd-border-visible)] px-1.5 font-mono text-[10px] text-[var(--nd-text-disabled)] sm:block">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <Command.List className="max-h-[360px] overflow-y-auto p-2 [scrollbar-width:thin]">
          <Command.Empty className="py-8 text-center font-sans text-sm text-[var(--nd-text-disabled)]">
            No results found.
          </Command.Empty>

          {/* Actions */}
          <Command.Group
            heading="Actions"
            className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-[var(--nd-text-disabled)]"
          >
            <PaletteItem
              icon={<BookmarkPlus className="size-3.5" />}
              label="New Bookmark"
              shortcut="N"
              onSelect={() => run(() => setFormOpen(true))}
            />
            <PaletteItem
              icon={<PanelLeftClose className="size-3.5" />}
              label="Toggle Sidebar"
              shortcut="⌘B"
              onSelect={() => run(toggleSidebar)}
            />
            <PaletteItem
              icon={<Layers className="size-3.5" />}
              label="Stack View"
              onSelect={() => run(() => setViewMode('stack'))}
            />
            <PaletteItem
              icon={<LayoutGrid className="size-3.5" />}
              label="Grid View"
              onSelect={() => run(() => setViewMode('grid'))}
            />
            <PaletteItem
              icon={<List className="size-3.5" />}
              label="List View"
              onSelect={() => run(() => setViewMode('list'))}
            />
          </Command.Group>

          {/* Navigation */}
          <Command.Group
            heading="Navigate"
            className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-[var(--nd-text-disabled)]"
          >
            <PaletteItem
              icon={<LayoutDashboard className="size-3.5" />}
              label="Dashboard"
              onSelect={() => run(() => router.push('/dashboard'))}
            />
            <PaletteItem
              icon={<Settings className="size-3.5" />}
              label="Settings"
              onSelect={() => run(() => router.push('/settings'))}
            />
            <PaletteItem
              icon={<Upload className="size-3.5" />}
              label="Import / Export"
              onSelect={() => run(() => router.push('/settings/import-export'))}
            />
            <PaletteItem
              icon={<Share2 className="size-3.5" />}
              label="Shared Links"
              onSelect={() => run(() => router.push('/settings/shared-links'))}
            />
          </Command.Group>

          {/* Categories */}
          {flatCategories.length > 0 && (
            <Command.Group
              heading="Categories"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-[var(--nd-text-disabled)]"
            >
              {flatCategories.map((cat) => (
                <PaletteItem
                  key={cat.id}
                  icon={
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                  }
                  label={cat.name}
                  onSelect={() =>
                    run(() => router.push(`/dashboard?category=${cat.id}`))
                  }
                />
              ))}
            </Command.Group>
          )}

          {/* Theme */}
          <Command.Group
            heading="Theme"
            className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-[var(--nd-text-disabled)]"
          >
            <PaletteItem
              icon={<Sun className="size-3.5" />}
              label="Light Mode"
              onSelect={() => run(() => setTheme('light'))}
            />
            <PaletteItem
              icon={<Moon className="size-3.5" />}
              label="Dark Mode"
              onSelect={() => run(() => setTheme('dark'))}
            />
            <PaletteItem
              icon={<Monitor className="size-3.5" />}
              label="System Theme"
              onSelect={() => run(() => setTheme('system'))}
            />
          </Command.Group>
        </Command.List>

        {/* Footer hint */}
        <div className="flex items-center gap-4 border-t border-[var(--nd-border)] px-4 py-2.5">
          <span className="font-mono text-[10px] text-[var(--nd-text-disabled)]">
            <kbd className="rounded border border-[var(--nd-border-visible)] px-1">↑↓</kbd> navigate
          </span>
          <span className="font-mono text-[10px] text-[var(--nd-text-disabled)]">
            <kbd className="rounded border border-[var(--nd-border-visible)] px-1">↵</kbd> select
          </span>
          <span className="font-mono text-[10px] text-[var(--nd-text-disabled)]">
            <kbd className="rounded border border-[var(--nd-border-visible)] px-1">esc</kbd> close
          </span>
        </div>
      </Command>
    </div>
  )
}

function PaletteItem({
  icon,
  label,
  shortcut,
  onSelect,
}: {
  icon: React.ReactNode
  label: string
  shortcut?: string
  onSelect: () => void
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-[8px] px-3 py-2.5 font-sans text-sm text-[var(--nd-text-primary)] outline-none data-[selected=true]:bg-[var(--nd-surface-raised)] data-[selected=true]:text-[var(--nd-text-display)]"
    >
      <span className="flex size-5 shrink-0 items-center justify-center text-[var(--nd-text-secondary)]">
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {shortcut && (
        <kbd className="shrink-0 rounded border border-[var(--nd-border-visible)] px-1.5 font-mono text-[10px] text-[var(--nd-text-disabled)]">
          {shortcut}
        </kbd>
      )}
    </Command.Item>
  )
}
