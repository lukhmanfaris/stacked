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
      <div className="relative flex items-center border-b border-[var(--nd-border)] focus-within:border-[var(--nd-border-visible)] transition-colors">
        {/* Leading icon */}
        <div className="pointer-events-none flex items-center pr-2">
          {isSearching ? (
            <div className="size-3.5 animate-spin rounded-full border border-[var(--nd-border-visible)] border-t-[var(--nd-text-primary)]" />
          ) : (
            <Search className="size-3.5 text-[var(--nd-text-disabled)]" aria-hidden="true" />
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
            'h-9 w-full bg-transparent py-2 font-mono text-sm text-[var(--nd-text-primary)]',
            'outline-none placeholder:text-[var(--nd-text-disabled)] placeholder:font-mono',
          )}
        />

        {/* Trailing */}
        <div className="flex items-center gap-1.5 pl-2">
          {value ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => { onClear(); inputRef.current?.focus() }}
              className="text-[var(--nd-text-disabled)] hover:text-[var(--nd-text-secondary)] transition-colors"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <kbd className="hidden select-none font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--nd-text-disabled)] sm:inline-block">
              /
            </kbd>
          )}
          {resultCount !== undefined && value && !isSearching && (
            <span className="nd-label tabular-nums text-[var(--nd-text-disabled)]">
              {resultCount.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Recent searches dropdown */}
      {showRecent && recentSearches.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-[8px] border border-[var(--nd-border-visible)] bg-[var(--nd-surface)]">
          <p className="nd-label border-b border-[var(--nd-border)] px-3 py-2 text-[var(--nd-text-disabled)]">
            Recent
          </p>
          {recentSearches.map(q => (
            <button
              key={q}
              type="button"
              onMouseDown={() => selectRecent(q)}
              className="flex w-full items-center gap-2.5 border-b border-[var(--nd-border)] px-3 py-2.5 last:border-b-0 hover:bg-[var(--nd-surface-raised)] transition-colors"
            >
              <Clock className="size-3 shrink-0 text-[var(--nd-text-disabled)]" aria-hidden="true" />
              <span className="truncate font-mono text-xs text-[var(--nd-text-secondary)]">{q}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
