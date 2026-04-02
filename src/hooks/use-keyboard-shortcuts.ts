'use client'

import { useEffect, useRef } from 'react'
import { KEYBOARD_SHORTCUTS } from '@/lib/constants'

type ShortcutName = keyof typeof KEYBOARD_SHORTCUTS

/**
 * Register keyboard shortcuts. Callbacks can change between renders without
 * reattaching the listener, because they are stored in a ref.
 *
 * Guards automatically skip shortcuts when the focused element is an input,
 * textarea, or contenteditable — except Escape, which always fires.
 */
export function useKeyboardShortcuts(
  shortcuts: Partial<Record<ShortcutName, () => void>>,
) {
  const shortcutsRef = useRef(shortcuts)
  shortcutsRef.current = shortcuts

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const active = document.activeElement
      const isTyping =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLElement && active.isContentEditable)

      for (const [name, handler] of Object.entries(shortcutsRef.current) as [
        ShortcutName,
        (() => void) | undefined,
      ][]) {
        if (!handler) continue
        const shortcut = KEYBOARD_SHORTCUTS[name]

        // Escape fires even inside inputs
        if (shortcut.key === 'Escape') {
          if (e.key === 'Escape') {
            e.preventDefault()
            handler()
          }
          continue
        }

        if (isTyping) continue

        if (shortcut.mod) {
          if (
            (e.metaKey || e.ctrlKey) &&
            e.key.toLowerCase() === shortcut.key.toLowerCase()
          ) {
            e.preventDefault()
            handler()
          }
        } else {
          if (
            !e.metaKey &&
            !e.ctrlKey &&
            !e.altKey &&
            e.key.toLowerCase() === shortcut.key.toLowerCase()
          ) {
            e.preventDefault()
            handler()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, []) // intentionally empty — we use ref for latest shortcuts
}
