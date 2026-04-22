import { cn } from '@/lib/utils'
import type { SharedLinkTheme } from '@/types/shared-link'

interface PortableThemeProps {
  theme: SharedLinkTheme
  children: React.ReactNode
  className?: string
}

export function PortableTheme({ theme, children, className }: PortableThemeProps) {
  return (
    <div
      className={cn(
        'min-h-screen',
        theme === 'dark' ? 'bg-neutral-950 text-neutral-50' : 'bg-white text-neutral-900',
        className,
      )}
      data-theme={theme}
    >
      {children}
    </div>
  )
}
