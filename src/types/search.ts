import type { Bookmark, LinkStatus } from './bookmark'

export type SearchResult = Bookmark

export interface SearchResponse {
  results: SearchResult[]
  total: number
  page: number
  per_page: number
  has_next: boolean
  query: string
}

export interface SearchFilters {
  category_id?: string | null
  tags?: string[]
  link_status?: LinkStatus
  is_pinned?: boolean
  is_archived?: boolean
  date_from?: string
  date_to?: string
  sort_by?: 'created_at' | 'updated_at' | 'title'
  sort_dir?: 'asc' | 'desc'
  page?: number
  per_page?: number
}
