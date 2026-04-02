import type { ParsedBookmark, ParseResult } from './types'

/** Parse a single CSV line handling quoted fields */
function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let i = 0

  while (i < line.length) {
    if (line[i] === '"') {
      // Quoted field
      let field = ''
      i++ // skip opening quote
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          field += '"'
          i += 2
        } else if (line[i] === '"') {
          i++ // skip closing quote
          break
        } else {
          field += line[i++]
        }
      }
      fields.push(field)
      if (line[i] === ',') i++ // skip comma
    } else {
      // Unquoted field
      const end = line.indexOf(',', i)
      if (end === -1) {
        fields.push(line.slice(i).trim())
        break
      } else {
        fields.push(line.slice(i, end).trim())
        i = end + 1
      }
    }
  }

  return fields
}

export function parseCsv(raw: string): ParseResult {
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')

  if (lines.length < 2) {
    return { bookmarks: [], folders: [], error: 'CSV file is empty or has no data rows' }
  }

  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().trim())

  const urlIdx = headers.indexOf('url')
  if (urlIdx === -1) {
    return { bookmarks: [], folders: [], error: 'CSV must have a "url" column' }
  }

  const titleIdx = headers.indexOf('title')
  const descIdx = headers.indexOf('description')
  const categoryIdx = headers.findIndex(h => h === 'category' || h === 'folder')
  const tagsIdx = headers.findIndex(h => h === 'tags' || h === 'tag')

  const bookmarks: ParsedBookmark[] = []
  const folderSet = new Set<string>()

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const fields = parseCsvLine(line)
    const url = fields[urlIdx]?.trim()
    if (!url) continue

    const folder = categoryIdx !== -1 ? fields[categoryIdx]?.trim() || undefined : undefined
    if (folder) folderSet.add(folder)

    const rawTags = tagsIdx !== -1 ? fields[tagsIdx]?.trim() : undefined
    const tags = rawTags
      ? rawTags.split(/[;|]/).map(t => t.trim()).filter(Boolean)
      : undefined

    bookmarks.push({
      url,
      title: titleIdx !== -1 && fields[titleIdx]?.trim() ? fields[titleIdx].trim() : url,
      description: descIdx !== -1 ? fields[descIdx]?.trim() || undefined : undefined,
      folder,
      tags,
    })
  }

  return { bookmarks, folders: Array.from(folderSet) }
}
