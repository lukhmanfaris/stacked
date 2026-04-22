export type SharedLinkLayout = 'minimal' | 'cards' | 'masonry' | 'terminal'
export type SharedLinkTheme = 'light' | 'dark'

export interface SharedLink {
  id: string
  user_id: string
  slug: string
  title: string | null
  description: string | null
  is_active: boolean
  layout: SharedLinkLayout
  theme: SharedLinkTheme
  category_ids: string[]
  show_favicons: boolean
  show_descriptions: boolean
  show_tags: boolean
  view_count: number
  created_at: string
  updated_at: string
}

export interface SharedLinkFormData {
  title?: string
  description?: string
  slug?: string
  layout?: SharedLinkLayout
  theme?: SharedLinkTheme
  category_ids?: string[]
  is_active?: boolean
  show_favicons?: boolean
  show_descriptions?: boolean
  show_tags?: boolean
}
