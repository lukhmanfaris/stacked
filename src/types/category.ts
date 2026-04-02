export interface Category {
  id: string
  user_id: string
  name: string
  slug: string
  description: string | null
  color: string
  icon: string | null
  parent_id: string | null
  sort_order: number
  bookmark_count: number
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface CategoryTree extends Category {
  children: Category[]
}

export interface CategoryFormData {
  name: string
  description?: string
  color: string
  icon?: string
  parent_id?: string | null
}
