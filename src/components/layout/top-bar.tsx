'use client'

import { useCallback, useMemo } from 'react'
import { useRouter, usePathname, useSearchParams } from 
'next/navigation'
import {
  PanelLeft,
  Plus,
  LayoutGrid,
  List,
  Layers,
  ArrowUpDown,
  SlidersHorizontal,
  LogOut,
  Settings,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { SearchBar } from '@/components/search/search-bar'
import { useCategories } from '@/hooks/use-categories'
import { useBookmarkCounts } from '@/hooks/use-bookmark-counts'
import { useDashboard, type ViewMode } from 
'@/contexts/dashboard-context'
import { useUser } from '@/contexts/user-context'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from 
'@/components/ui/avatar'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const VIEW_OPTIONS: { mode: ViewMode; icon: React.ElementType; 
label: string }[] = [
  { mode: 'stack', icon: Layers, label: 'Stack' },
  { mode: 'grid', icon: LayoutGrid, label: 'Grid' },
  { mode: 'list', icon: List, label: 'List' },
]

interface SortOption {
  key: string
  label: string
  sort_by: 'created_at' | 'updated_at' | 'title'
  sort_dir: 'asc' | 'desc'
}

const SORT_OPTIONS: SortOption[] = [
  { key: 'newest', label: 'Newest', sort_by: 'created_at', sort_dir: 
'desc' },
  { key: 'oldest', label: 'Oldest', sort_by: 'created_at', sort_dir: 
'asc' },
  { key: 'az', label: 'A → Z', sort_by: 'title', sort_dir: 'asc' },
  { key: 'za', label: 'Z → A', sort_by: 'title', sort_dir: 'desc' },
  { key: 'updated', label: 'Recently updated', sort_by: 
'updated_at', sort_dir: 'desc' },
]

export function TopBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { sidebarOpen, toggleSidebar, viewMode, setViewMode, 
setFormOpen } = useDashboard()
  const { categories } = useCategories()
  const { counts } = useBookmarkCounts()
  const { profile } = useUser()

  const isDashboard = pathname === '/dashboard'

  const activeCategoryId = searchParams.get('category')
  const activeView = searchParams.get('view')
  const activeTag = searchParams.get('tag')
  const currentSort = searchParams.get('sort') ?? 'newest'

  const activeCategory = useMemo(() => {
    if (!activeCategoryId) return null
    return (
      categories.find(c => c.id === activeCategoryId) ??
      categories.flatMap(c => c.children).find(c => c.id === 
activeCategoryId) ??
      null
    )
  }, [activeCategoryId, categories])

  const { title, subtitle } = useMemo(() => {
    if (!isDashboard) return { title: '', subtitle: '' }
    if (activeCategory) {
      const n = counts.by_category[activeCategory.id] ?? 
activeCategory.bookmark_count ?? 0
      return { title: activeCategory.name, subtitle: `${n} 
bookmark${n === 1 ? '' : 's'}` }
    }
    if (activeTag) {
      const n = counts.by_tag[activeTag] ?? 0
      return { title: `#${activeTag}`, subtitle: `${n} bookmark${n 
=== 1 ? '' : 's'}` }
    }
    switch (activeView) {
      case 'favorites':
        return { title: 'Favorites', subtitle: `${counts.favorites} 
bookmark${counts.favorites === 1 ? '' : 's'}` }
      case 'archive':
        return { title: 'Archive', subtitle: `${counts.archived} 
bookmark${counts.archived === 1 ? '' : 's'}` }
      case 'trash':
        return { title: 'Trash', subtitle: `${counts.trashed} 
bookmark${counts.trashed === 1 ? '' : 's'}` }
      case 'unsorted':
        return { title: 'Unsorted', subtitle: `${counts.unsorted} 
bookmark${counts.unsorted === 1 ? '' : 's'}` }
      default:
        return { title: 'All Bookmarks', subtitle: `${counts.total} 
bookmark${counts.total === 1 ? '' : 's'}` }
    }
  }, [isDashboard, activeCategory, activeTag, activeView, counts])

  const updateSearchParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(searchParams.toString())
      if (value == null) next.delete(key)
      else next.set(key, value)
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname)
    },
    [pathname, router, searchParams]
  )

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Failed to log out.')
      return
    }
    router.replace('/login')
  }

  function handleSearchChange(q: string) {
    updateSearchParam('q', q.trim() || null)
  }

  function handleFilterClick() {
    window.dispatchEvent(new 
CustomEvent('dashboard:open-filter-panel'))
  }

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map(n => 
n[0]).join('').slice(0, 2).toUpperCase()
    : profile?.username
    ? profile.username.slice(0, 2).toUpperCase()
    : '?'

  const currentSortLabel = SORT_OPTIONS.find(o => o.key === 
currentSort)?.label ?? 'Newest'

  return (
    <header className="flex min-h-16 shrink-0 items-center gap-3 
border-b border-[var(--nd-border)] bg-[var(--nd-surface)] px-4 
py-2.5">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        className="shrink-0"
      >
        <PanelLeft className="size-4" />
      </Button>

      {isDashboard ? (
        <div className="hidden min-w-0 flex-col sm:flex">
          <h1 className="truncate font-sans text-[15px] 
font-semibold text-[var(--nd-text-display)]">{title}</h1>
          <span className="nd-label truncate 
text-[var(--nd-text-disabled)]">{subtitle}</span>
        </div>
      ) : null}

      <div className="mx-auto min-w-0 max-w-md flex-1">
        <SearchBar
          value={searchParams.get('q') ?? ''}
          onChange={handleSearchChange}
          onClear={() => updateSearchParam('q', null)}
          placeholder="Search bookmarks…"
        />
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {isDashboard && (
          <div className="hidden items-center md:flex">
            {VIEW_OPTIONS.map(({ mode, icon: Icon, label }) => (
              <Button
                key={mode}
                variant="ghost"
                size="icon"
                onClick={() => setViewMode(mode)}
                aria-label={label}
                aria-pressed={viewMode === mode}
                className={cn(
                  viewMode === mode
                    ? 'text-[var(--nd-text-display)] bg-[var(--nd-surface-raised)]'
                    : 'text-[var(--nd-text-disabled)]'
                )}
              >
                <Icon className="size-4" />
              </Button>
            ))}
          </div>
        )}

        {isDashboard && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                'hidden items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 transition-colors md:inline-flex',
                'border border-[var(--nd-border-visible)] text-[var(--nd-text-secondary)]',
                'hover:text-[var(--nd-text-primary)] hover:border-[var(--nd-text-primary)]',
                'font-mono text-[11px] uppercase tracking-[0.06em]'
              )}
              aria-label="Sort bookmarks"
            >
              <ArrowUpDown className="size-3.5" />
              <span>{currentSortLabel}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-[8px] border-[var(--nd-border-visible)] bg-[var(--nd-surface)] p-1">
              {SORT_OPTIONS.map(opt => (
                <DropdownMenuItem
                  key={opt.key}
                  onClick={() => updateSearchParam('sort', opt.key === 'newest' ? null : opt.key)}
                  className="nd-label cursor-pointer rounded-[4px] px-3 py-2 text-[var(--nd-text-secondary)] hover:text-[var(--nd-text-primary)] hover:bg-[var(--nd-surface-raised)]"
                >
                  {currentSort === opt.key ? <Check className="mr-2 size-3.5 text-[var(--nd-text-display)]" /> : <span className="mr-2 size-3.5" />}
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {isDashboard && (
          <Button variant="ghost" size="icon" onClick={handleFilterClick} aria-label="Open filters" className="hidden md:flex text-[var(--nd-text-secondary)]">
            <SlidersHorizontal className="size-4" />
          </Button>
        )}

        <Button variant="default" size="sm" onClick={() => setFormOpen(true)} aria-label="Add bookmark" className={cn('ml-1 hidden bg-[var(--nd-accent)] text-white hover:bg-[var(--nd-accent)]/90 sm:inline-flex', 'gap-1.5')}>
          <Plus className="size-4" />
          <span className="hidden md:inline">Add Bookmark</span>
        </Button>

        <Button variant="ghost" size="icon" onClick={() => setFormOpen(true)} aria-label="Add bookmark" className="sm:hidden">
          <Plus className="size-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--nd-border-visible)] ml-1" aria-label="Open user menu">
            <Avatar className="size-8 border border-[var(--nd-border-visible)]">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="nd-label text-[10px] bg-[var(--nd-surface-raised)] text-[var(--nd-text-primary)]">{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52 rounded-[8px] border-[var(--nd-border-visible)] bg-[var(--nd-surface)] p-1">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-3 py-2">
                <p className="nd-label text-[var(--nd-text-primary)]">{profile?.username ?? 'User'}</p>
                {profile?.display_name && (
                  <p className="mt-0.5 truncate text-xs font-sans font-normal text-[var(--nd-text-secondary)]">{profile.display_name}</p>
                )}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-[var(--nd-border)]" />
            <DropdownMenuItem onClick={() => 
router.push('/settings')} className="nd-label cursor-pointer 
rounded-[4px] px-3 py-2 text-[var(--nd-text-secondary)] 
hover:text-[var(--nd-text-primary)] 
hover:bg-[var(--nd-surface-raised)]">
              <Settings className="mr-2 size-3.5" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[var(--nd-border)]" />
            <DropdownMenuItem onClick={handleLogout} 
className="nd-label cursor-pointer rounded-[4px] px-3 py-2 
text-[var(--nd-accent)] hover:bg-[var(--nd-accent-subtle)]">
              <LogOut className="mr-2 size-3.5" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}