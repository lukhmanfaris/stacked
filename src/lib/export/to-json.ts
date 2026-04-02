import type { Bookmark } from '@/types/bookmark'
import type { Category } from '@/types/category'

export function exportToJson(bookmarks: Bookmark[], categories: Category[]): string {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]))

  const items = bookmarks.map(bm => ({
    url: bm.url,
    title: bm.title,
    description: bm.description ?? undefined,
    category: categoryMap.get(bm.category_id) ?? undefined,
    tags: bm.tags.length > 0 ? bm.tags : undefined,
    is_pinned: bm.is_pinned || undefined,
    created_at: bm.created_at,
  }))

  const payload = {
    version: 1,
    exported_at: new Date().toISOString(),
    bookmarks: items,
  }

  return JSON.stringify(payload, null, 2)
}
