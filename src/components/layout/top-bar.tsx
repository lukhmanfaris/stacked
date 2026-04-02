'use client'

import { useMemo } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  PanelLeft,
  Plus,
  LayoutGrid,
  List,
  Layers,
  ChevronRight,
  Home,
  LogOut,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'
import { SearchBar } from '@/components/search/search-bar'
import { ThemeToggle } from './theme-toggle'
import { useCategories } from '@/hooks/use-categories'
import { useDashboard, type ViewMode } from '@/contexts/dashboard-context'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const VIEW_OPTIONS: { mode: ViewMode; icon: React.ElementType; label: string }[] = [
  { mode: 'stack', icon: Layers, label: 'Stack view' },
  { mode: 'grid', icon: LayoutGrid, label: 'Grid view' },
  { mode: 'list', icon: List, label: 'List view' },
]

export function TopBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { sidebarOpen, toggleSidebar, viewMode, setViewMode, setFormOpen } = useDashboard()
  const { categories } = useCategories()
  const { profile } = useUser()

  const activeCategoryId = searchParams.get('category')
  const activeCategory = useMemo(() => {
    if (!activeCategoryId) return null
    return (
      categories.find(c => c.id === activeCategoryId) ??
      categories.flatMap(c => c.children).find(c => c.id === activeCategoryId) ??
      null
    )
  }, [activeCategoryId, categories])

  const isDashboard = pathname === '/dashboard'

  async function handleLogout() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) { toast.error('Failed to log out. Please try again.'); return }
    router.replace('/login')
  }

  function handleSearchChange(q: string) {
    if (q.trim()) {
      router.push(`/search?q=${encodeURIComponent(q)}`)
    }
  }

  const initials = profile?.display_name
    ? profile.display_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : profile?.username
    ? profile.username.slice(0, 2).toUpperCase()
    : '?'

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-3">
      {/* Sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        className="shrink-0"
      >
        <PanelLeft className="size-4" />
      </Button>

      {/* Breadcrumb — dashboard only */}
      {isDashboard && (
        <div className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
          <Link href="/dashboard" className="transition-colors hover:text-foreground">
            <Home className="size-3.5" />
          </Link>
          {activeCategory && (
            <>
              <ChevronRight className="size-3.5" />
              <span className="font-medium text-foreground">{activeCategory.name}</span>
            </>
          )}
        </div>
      )}

      {/* Search — centered, flexible */}
      <div className="mx-auto min-w-0 flex-1 sm:max-w-md">
        <SearchBar
          value=""
          onChange={handleSearchChange}
          onClear={() => {}}
          placeholder="Search bookmarks…"
        />
      </div>

      {/* Right actions */}
      <div className="flex shrink-0 items-center gap-1">
        {/* Add bookmark */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setFormOpen(true)}
          aria-label="Add bookmark"
          className="hidden sm:flex"
        >
          <Plus className="size-4" />
        </Button>

        {/* View mode — dashboard only, md+ */}
        {isDashboard &&
          VIEW_OPTIONS.map(({ mode, icon: Icon, label }) => (
            <Button
              key={mode}
              variant="ghost"
              size="icon"
              onClick={() => setViewMode(mode)}
              aria-label={label}
              aria-pressed={viewMode === mode}
              className={cn(
                'hidden md:flex',
                viewMode === mode && 'bg-muted text-foreground',
              )}
            >
              <Icon className="size-4" />
            </Button>
          ))}

        <ThemeToggle />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Open user menu"
          >
            <Avatar className="size-8">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <p className="font-medium">{profile?.username ?? 'User'}</p>
                {profile?.display_name && (
                  <p className="truncate text-xs font-normal text-muted-foreground">
                    {profile.display_name}
                  </p>
                )}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="mr-2 size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
