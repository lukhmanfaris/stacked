'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Plus, FolderOpen, Settings } from 'lucide-react'
import { useDashboard } from '@/contexts/dashboard-context'
import { cn } from '@/lib/utils'

export function MobileNav() {
  const pathname = usePathname()
  const { setSidebarOpen, setFormOpen } = useDashboard()

  return (
    <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-30 border-t bg-background lg:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {/* Home */}
        <Link
          href="/dashboard"
          className={cn(
            'flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-xs transition-colors',
            pathname === '/dashboard'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Home className="size-5" />
          <span>Home</span>
        </Link>

        {/* Search */}
        <Link
          href="/search"
          className={cn(
            'flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-xs transition-colors',
            pathname === '/search'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Search className="size-5" />
          <span>Search</span>
        </Link>

        {/* Add — prominent center button */}
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          aria-label="Add bookmark"
          className="flex flex-col items-center gap-0.5"
        >
          <div className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md active:scale-95 transition-transform">
            <Plus className="size-5" />
          </div>
        </button>

        {/* Categories (opens sidebar drawer) */}
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open categories"
          className="flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <FolderOpen className="size-5" />
          <span>Categories</span>
        </button>

        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            'flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-xs transition-colors',
            pathname === '/settings'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Settings className="size-5" />
          <span>Settings</span>
        </Link>
      </div>
    </nav>
  )
}
