import type { ParsedBookmark, ParseResult } from './types'

export function parseNetscapeHtml(html: string): ParseResult {
  const bookmarks: ParsedBookmark[] = []
  const folderSet = new Set<string>()

  let currentFolder: string | undefined

  // Split into lines for sequential processing
  const folderRe = /<H3[^>]*>([^<]+)<\/H3>/i
  const bookmarkRe = /<A\s+HREF="([^"]+)"([^>]*)>([^<]*)<\/A>/i
  const addDateRe = /ADD_DATE="(\d+)"/i

  // Walk through tags in order
  const tagRe = /<\/?(?:H3|A|DL|DT|DD|H1)[^>]*>(?:[^<]*)?/gi
  const rawTagRe = /<[^>]+>/g

  // Process line by line isn't reliable with multiline HTML; use a token approach
  // Replace newlines to make regex more reliable
  const normalized = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Extract tokens: we care about H3 (folder), A (bookmark), and /DL (end folder)
  const tokenRe = /<H3[^>]*>([^<]+)<\/H3>|<A\s+HREF="([^"]+)"([^>]*)>([^<]*)<\/A>|<\/DL>/gi
  let match: RegExpExecArray | null

  const folderStack: string[] = []

  while ((match = tokenRe.exec(normalized)) !== null) {
    const full = match[0]

    if (full.startsWith('<H3')) {
      const name = match[1]?.trim() ?? ''
      if (name) {
        folderStack.push(name)
        currentFolder = name
      }
    } else if (full.startsWith('</DL')) {
      folderStack.pop()
      currentFolder = folderStack[folderStack.length - 1]
    } else if (full.startsWith('<A ')) {
      const url = match[2] ?? ''
      const attrs = match[3] ?? ''
      const title = match[4]?.trim() ?? ''

      if (!url || url.startsWith('javascript:') || url.startsWith('place:')) continue

      let addDate: string | undefined
      const dateMatch = addDateRe.exec(attrs)
      if (dateMatch) addDate = dateMatch[1]

      const bm: ParsedBookmark = {
        url,
        title: title || url,
        folder: currentFolder,
        add_date: addDate,
      }

      if (currentFolder) folderSet.add(currentFolder)
      bookmarks.push(bm)
    }
  }

  return { bookmarks, folders: Array.from(folderSet) }
}
