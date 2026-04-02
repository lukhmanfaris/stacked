'use client'

import { useRef, useEffect, useState } from 'react'
import { Search, X, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  resultCount?: number
  isSearching?: boolean
  recentSearches?: string[]
  onSelectRecent?: (query: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export function SearchBar({
  value,
  onChange,
  onClear,
  resultCount,
  isSearching = false,
  recentSearches = [],
  onSelectRecent,
  placeholder = 'Search bookmarks…',
  className,
  autoFocus = false,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [showRecent, setShowRecent] = useState(false)

  // Focus on "/" keypress when no other input is active
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== '/') return
      const active = document.activeElement
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Escape clears and blurs
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      if (value) {
        onClear()
      } else {
        inputRef.current?.blur()
        setShowRecent(false)
      }
    }
  }

  function handleFocus() {
    if (!value && recentSearches.length > 0) setShowRecent(true)
  }

  function handleBlur() {
    // Delay so click on recent item registers first
    setTimeout(() => setShowRecent(false), 150)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value)
    setShowRecent(!e.target.value && recentSearches.length > 0)
  }

  function selectRecent(query: string) {
    onSelectRecent?.(query)
    setShowRecent(false)
    inputRef.current?.focus()
  }

  return (
    <div className={cn('relative w-full', className)}>
      <div className="relative flex items-center">
        {/* Leading icon */}
        <div className="pointer-events-none absolute left-3 flex items-center">
          {isSearching ? (
            <div className="size-4 animate-spin rounded-full border-2 border-muted border-t-foreground" />
          ) : (
            <Search className="size-4 text-muted-foreground" aria-hidden="true" />
          )}
        </div>

        <input
          ref={inputRef}
          type="search"
          role="searchbox"
          aria-label="Search bookmarks"
          autoFocus={autoFocus}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            'h-10 w-full rounded-xl border border-input bg-transparent py-2 pl-9 pr-16 text-sm',
            'outline-none transition-colors placeholder:text-muted-foreground',
            'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50',
          )}
        />

        {/* Trailing: clear button or "/" hint */}
        <div className="absolute right-3 flex items-center gap-1.5">
          {value ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => { onClear(); inputRef.current?.focus() }}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          ) : (
            <kbd className="hidden select-none rounded border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground sm:inline-block">
              /
            </kbd>
          )}
          {/* Result count badge */}
          {resultCount !== undefined && value && !isSearching && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {resultCount.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Recent searches dropdown */}
      {showRecent && recentSearches.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border bg-popover shadow-md">
          <p className="px-3 py-2 text-xs font-medium text-muted-foreground">Recent searches</p>
          {recentSearches.map(q => (
            <button
              key={q}
              type="button"
              onMouseDown={() => selectRecent(q)}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted"
            >
              <Clock className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="truncate">{q}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
