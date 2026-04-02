'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Monitor, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const THEMES = ['system', 'light', 'dark'] as const
type ThemeOption = (typeof THEMES)[number]

const ICONS: Record<ThemeOption, typeof Sun> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
}

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Prevent hydration mismatch — render empty placeholder until mounted
  if (!mounted) {
    return <div className={cn('size-8', className)} />
  }

  const current = (theme as ThemeOption) ?? 'system'
  const Icon = ICONS[current] ?? Monitor

  function toggle() {
    const idx = THEMES.indexOf(current)
    setTheme(THEMES[(idx + 1) % THEMES.length])
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={`Switch theme (current: ${current})`}
      className={className}
    >
      <Icon className="size-4 transition-all duration-200" />
    </Button>
  )
}
