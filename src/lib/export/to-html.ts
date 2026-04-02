import type { Bookmark } from '@/types/bookmark'
import type { Category } from '@/types/category'

export function exportToHtml(bookmarks: Bookmark[], categories: Category[]): string {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]))

  // Group bookmarks by category
  const grouped = new Map<string, Bookmark[]>()
  for (const bm of bookmarks) {
    const name = categoryMap.get(bm.category_id) ?? 'Uncategorized'
    if (!grouped.has(name)) grouped.set(name, [])
    grouped.get(name)!.push(bm)
  }

  const lines: string[] = [
    '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
    '<!-- This is an automatically generated file.',
    '     It will be read and overwritten.',
    '     DO NOT EDIT! -->',
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    '<TITLE>Bookmarks</TITLE>',
    '<H1>Bookmarks</H1>',
    '<DL><p>',
  ]

  for (const [folderName, items] of grouped) {
    lines.push(`    <DT><H3>${escapeHtml(folderName)}</H3>`)
    lines.push('    <DL><p>')
    for (const bm of items) {
      const addDate = Math.floor(new Date(bm.created_at).getTime() / 1000)
      const desc = bm.description ? ` SHORTCUTURL="${escapeAttr(bm.description)}"` : ''
      lines.push(
        `        <DT><A HREF="${escapeAttr(bm.url)}" ADD_DATE="${addDate}"${desc}>${escapeHtml(bm.title)}</A>`
      )
    }
    lines.push('    </DL><p>')
  }

  lines.push('</DL><p>')
  return lines.join('\n')
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
}
