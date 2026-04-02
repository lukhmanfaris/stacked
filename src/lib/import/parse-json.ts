import type { ParsedBookmark, ParseResult } from './types'

interface StackedExportBookmark {
  url: string
  title?: string
  description?: string
  category?: string
  tags?: string[]
  created_at?: string
}

interface StackedExport {
  version?: number | string
  bookmarks: StackedExportBookmark[]
}

export function parseStackedJson(raw: string): ParseResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { bookmarks: [], folders: [], error: 'Invalid JSON file' }
  }

  // Accept either an array of bookmarks or a { bookmarks: [...] } wrapper
  let items: unknown[]
  if (Array.isArray(parsed)) {
    items = parsed
  } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as StackedExport).bookmarks)) {
    items = (parsed as StackedExport).bookmarks
  } else {
    return { bookmarks: [], folders: [], error: 'Unrecognized JSON format' }
  }

  const bookmarks: ParsedBookmark[] = []
  const folderSet = new Set<string>()

  for (const item of items) {
    if (!item || typeof item !== 'object') continue
    const bm = item as Record<string, unknown>

    const url = typeof bm.url === 'string' ? bm.url.trim() : ''
    if (!url) continue

    const folder = typeof bm.category === 'string' ? bm.category.trim() : undefined
    if (folder) folderSet.add(folder)

    const tags = Array.isArray(bm.tags)
      ? (bm.tags as unknown[]).filter((t): t is string => typeof t === 'string')
      : undefined

    bookmarks.push({
      url,
      title: typeof bm.title === 'string' && bm.title.trim() ? bm.title.trim() : url,
      description: typeof bm.description === 'string' ? bm.description : undefined,
      folder,
      tags,
    })
  }

  return { bookmarks, folders: Array.from(folderSet) }
}
