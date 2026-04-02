export type UserTier = 'free' | 'pro'
export type OnboardingStep = 'username' | 'categories' | 'first_bookmark' | 'done'

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  default_view: 'stack' | 'grid' | 'list'
  default_category_id: string | null
  items_per_page: number
  show_favicons: boolean
  show_og_images: boolean
  compact_mode: boolean
  email_notifications: boolean
}

export interface Profile {
  id: string
  email: string
  email_verified: boolean
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  tier: UserTier
  onboarding_step: OnboardingStep
  preferences: UserPreferences
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  default_view: 'stack',
  default_category_id: null,
  items_per_page: 20,
  show_favicons: true,
  show_og_images: true,
  compact_mode: false,
  email_notifications: true,
}

export const TIER_LIMITS: Record<UserTier, {
  max_bookmarks: number
  max_categories: number
  max_shared_links: number
  smart_collections: boolean
  custom_themes: boolean
}> = {
  free: {
    max_bookmarks: 500,
    max_categories: 20,
    max_shared_links: 1,
    smart_collections: false,
    custom_themes: false,
  },
  pro: {
    max_bookmarks: 10_000,
    max_categories: 200,
    max_shared_links: 20,
    smart_collections: true,
    custom_themes: true,
  },
} as const
