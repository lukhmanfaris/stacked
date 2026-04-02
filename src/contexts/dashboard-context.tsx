'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type ViewMode = 'stack' | 'grid' | 'list'

interface DashboardContextValue {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  cycleViewMode: () => void
  /** Controls the global new-bookmark form modal */
  formOpen: boolean
  setFormOpen: (open: boolean) => void
}

const VIEW_MODES: ViewMode[] = ['stack', 'grid', 'list']
const STORAGE_VIEW = 'stacked:view-mode'

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewMode, setViewModeState] = useState<ViewMode>('grid')
  const [formOpen, setFormOpen] = useState(false)

  // Restore persisted view mode on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_VIEW) as ViewMode | null
    if (stored && VIEW_MODES.includes(stored)) setViewModeState(stored)
  }, [])

  // Collapse sidebar on small screens
  useEffect(() => {
    function checkSize() {
      setSidebarOpen(window.innerWidth >= 1024)
    }
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])

  function toggleSidebar() {
    setSidebarOpen(prev => !prev)
  }

  function setViewMode(mode: ViewMode) {
    setViewModeState(mode)
    localStorage.setItem(STORAGE_VIEW, mode)
  }

  function cycleViewMode() {
    const idx = VIEW_MODES.indexOf(viewMode)
    setViewMode(VIEW_MODES[(idx + 1) % VIEW_MODES.length])
  }

  return (
    <DashboardContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
        viewMode,
        setViewMode,
        cycleViewMode,
        formOpen,
        setFormOpen,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used inside DashboardProvider')
  return ctx
}
