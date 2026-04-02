'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, SlidersHorizontal, Share2, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Profile', href: '/settings/profile', icon: User },
  { label: 'Preferences', href: '/settings', icon: SlidersHorizontal, exact: true },
  { label: 'Import & Export', href: '/settings/import-export', icon: Upload },
  { label: 'Shared Links', href: '/settings/shared-links', icon: Share2, disabled: true },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:gap-8">
      {/* Sidebar nav */}
      <nav
        aria-label="Settings navigation"
        className="flex shrink-0 flex-row gap-1 overflow-x-auto lg:w-48 lg:flex-col"
      >
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href) && !item.exact

          return item.disabled ? (
            <span
              key={item.href}
              className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground/50"
              title="Coming in a future update"
            >
              <Icon className="size-4 flex-none" />
              {item.label}
              <span className="ml-auto hidden text-xs lg:block">Soon</span>
            </span>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
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
      </nav>

      {/* Page content */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
