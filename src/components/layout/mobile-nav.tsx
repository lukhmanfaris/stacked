'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useDashboard } from '@/contexts/dashboard-context'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Search', href: '/search' },
  { label: 'Settings', href: '/settings' },
]

export function MobileNav() {
  const pathname = usePathname()
  const { setSidebarOpen, setFormOpen } = useDashboard()

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--nd-border)] bg-[var(--nd-surface)] lg:hidden"
    >
      <div className="flex items-center justify-around px-4 py-2">
        {NAV_ITEMS.map(({ label, href }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'nd-label flex flex-col items-center gap-1 px-3 py-1 transition-colors',
                isActive
                  ? 'text-[var(--nd-text-display)]'
                  : 'text-[var(--nd-text-disabled)] hover:text-[var(--nd-text-secondary)]',
              )}
            >
              {isActive ? `[ ${label} ]` : label}
            </Link>
          )
        })}

        {/* Add — prominent center action */}
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          aria-label="Add bookmark"
          className="nd-label flex flex-col items-center gap-1 px-3 py-1 text-[var(--nd-text-disabled)] hover:text-[var(--nd-text-primary)] transition-colors"
        >
          + Add
        </button>

        {/* Categories drawer */}
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open categories"
          className="nd-label flex flex-col items-center gap-1 px-3 py-1 text-[var(--nd-text-disabled)] hover:text-[var(--nd-text-secondary)] transition-colors"
        >
          Folders
        </button>
      </div>
    </nav>
  )
}
