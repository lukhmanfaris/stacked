import type { Bookmark } from '@/types/bookmark'
import type { Category } from '@/types/category'

function csvField(value: string | undefined | null): string {
  const s = value ?? ''
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function exportToCsv(bookmarks: Bookmark[], categories: Category[]): string {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]))

  const header = ['url', 'title', 'description', 'category', 'tags', 'created_at']
  const rows = bookmarks.map(bm => [
    csvField(bm.url),
    csvField(bm.title),
    csvField(bm.description),
    csvField(categoryMap.get(bm.category_id)),
    csvField(bm.tags.join('|')),
    csvField(bm.created_at),
  ])

  return [header.join(','), ...rows.map(r => r.join(','))].join('\n')
}
