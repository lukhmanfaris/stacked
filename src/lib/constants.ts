import type { UserTier } from '@/types/profile'

export const APP_CONFIG = {
  name: 'Stacked',
  description: 'Your bookmarks, beautifully organized.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://stacked.app',
  creator: 'Stacked Team',
} as const

export const LIMITS = {
  MAX_BOOKMARKS_FREE: 500,
  MAX_BOOKMARKS_PRO: 10_000,
  MAX_CATEGORIES_FREE: 20,
  MAX_CATEGORIES_PRO: 200,
  MAX_TAGS_PER_BOOKMARK: 10,
  MAX_TAG_LENGTH: 30,
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_IMPORT_SIZE_MB: 10,
  MAX_SHARED_LINKS_FREE: 1,
  MAX_SHARED_LINKS_PRO: 20,
  METADATA_FETCH_TIMEOUT_MS: 8_000,
  SEARCH_DEBOUNCE_MS: 300,
  LINK_CHECK_BATCH_SIZE: 50,
  LINK_CHECK_INTERVAL_MS: 1_000,
  STALE_BOOKMARK_DAYS: 90,
  FAVICON_MAX_SIZE_KB: 500,
  OG_IMAGE_MAX_SIZE_KB: 2_048,
  AVATAR_MAX_SIZE_KB: 1_024,
  DOMAIN_HASH_LENGTH: 16,
  FAVICON_CACHE_TTL_DAYS: 90,
  OG_IMAGE_CACHE_TTL_DAYS: 30,
  ORPHAN_GRACE_PERIOD_DAYS: 7,
  USERNAME_CHECK_DEBOUNCE_MS: 400,
  VERIFY_EMAIL_RESEND_COOLDOWN_S: 60,
} as const

export const DEFAULT_CATEGORY = {
  name: 'General',
  color: '#6B7280',
  icon: 'inbox',
  is_default: true,
} as const

export const STARTER_CATEGORIES: Array<{
  name: string
  color: string
  icon: string
  emoji: string
}> = [
  { name: 'Development', color: '#3B82F6', icon: 'code-2', emoji: '💻' },
  { name: 'Design', color: '#8B5CF6', icon: 'palette', emoji: '🎨' },
  { name: 'News', color: '#EF4444', icon: 'newspaper', emoji: '📰' },
  { name: 'Reading', color: '#F59E0B', icon: 'book-open', emoji: '📚' },
  { name: 'Tools', color: '#14B8A6', icon: 'wrench', emoji: '🔧' },
  { name: 'Social', color: '#EC4899', icon: 'users', emoji: '👥' },
  { name: 'Shopping', color: '#22C55E', icon: 'shopping-bag', emoji: '🛍️' },
  { name: 'Recipes', color: '#F97316', icon: 'chef-hat', emoji: '🍳' },
  { name: 'Finance', color: '#06B6D4', icon: 'trending-up', emoji: '💰' },
  { name: 'Health', color: '#84CC16', icon: 'heart', emoji: '❤️' },
  { name: 'Travel', color: '#6366F1', icon: 'map-pin', emoji: '✈️' },
  { name: 'Entertainment', color: '#A855F7', icon: 'tv', emoji: '🎬' },
]

export const CATEGORY_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16',
  '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6',
  '#6366F1', '#8B5CF6', '#A855F7', '#EC4899',
] as const

export const KEYBOARD_SHORTCUTS = {
  SEARCH:          { key: '/',     mod: false, description: 'Focus search' },
  COMMAND_PALETTE: { key: 'k',     mod: true,  description: 'Open command palette' },
  NEW_BOOKMARK:    { key: 'n',     mod: false, description: 'Add new bookmark' },
  TOGGLE_VIEW:     { key: 'v',     mod: false, description: 'Toggle view mode' },
  TOGGLE_SIDEBAR:  { key: 'b',     mod: true,  description: 'Toggle sidebar' },
  ESCAPE:          { key: 'Escape',mod: false, description: 'Close modal / clear search' },
} as const
