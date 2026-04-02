export type LinkStatus = 'unchecked' | 'alive' | 'dead' | 'redirected' | 'timeout'

export interface Bookmark {
  id: string
  user_id: string
  category_id: string
  url: string
  title: string
  description: string | null
  domain: string
  tags: string[]
  favicon_url: string | null
  og_image_url: string | null
  is_pinned: boolean
  is_archived: boolean
  link_status: LinkStatus
  sort_order: number
  created_at: string
  updated_at: string
}

export interface BookmarkFormData {
  url: string
  title?: string
  description?: string
  category_id: string
  tags?: string[]
  is_pinned?: boolean
}

export interface BookmarkFilters {
  category_id?: string | null
  tags?: string[]
  is_pinned?: boolean
  is_archived?: boolean
  link_status?: LinkStatus
  sort_by?: 'created_at' | 'updated_at' | 'title' | 'sort_order'
  sort_dir?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export type BulkActionType =
  | { type: 'move'; category_id: string }
  | { type: 'delete' }
  | { type: 'archive' }
  | { type: 'unarchive' }
  | { type: 'pin' }
  | { type: 'unpin' }
  | { type: 'tag'; tags: string[] }

export interface BookmarkListResponse {
  bookmarks: Bookmark[]
  total: number
  page: number
  per_page: number
  has_next: boolean
}

export interface CreateBookmarkResponse {
  bookmark: Bookmark
  duplicate_warning: boolean
  existing_id: string | null
}
