export interface ParsedBookmark {
  url: string
  title: string
  description?: string
  folder?: string   // maps to category name
  tags?: string[]
  add_date?: string // unix timestamp string from HTML
}

export interface ParseResult {
  bookmarks: ParsedBookmark[]
  folders: string[]   // unique folder names found
  error?: string
}
