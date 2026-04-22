'use client'

import { Suspense } from 'react'
import { AuthGuard } from '@/components/shared/auth-guard'
import { DashboardProvider, useDashboard } from '@/contexts/dashboard-context'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/top-bar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { CommandPalette } from '@/components/shared/command-palette'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

function PaletteShortcut() {
  const { setPaletteOpen } = useDashboard()
  useKeyboardShortcuts({ COMMAND_PALETTE: () => setPaletteOpen(true) })
  return null
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <DashboardProvider>
        <PaletteShortcut />
        <CommandPalette />

        {/* Full-screen flex container */}
        <div className="flex h-screen overflow-hidden bg-background">
          {/* Sidebar — hidden on mobile, fixed on desktop */}
          <Suspense fallback={<div className="hidden shrink-0 border-r lg:block" style={{ width: 240 }} />}>
            <Sidebar />
          </Suspense>

          {/* Main column */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {/* Top bar */}
            <Suspense fallback={<div className="h-14 shrink-0 border-b bg-background" />}>
              <TopBar />
            </Suspense>

            {/* Page content */}
            <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
              {children}
            </main>
          </div>
        </div>

        {/* Bottom nav — mobile only */}
        <MobileNav />
      </DashboardProvider>
    </AuthGuard>
  )
}
