import { z } from 'zod'

export const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-z0-9_-]+$/, 'Only lowercase letters, numbers, underscores, and hyphens'),
  display_name: z.string().max(50).optional(),
  bio: z.string().max(300).optional(),
})

export const onboardingSchema = z.object({
  step: z.enum(['username', 'categories', 'first_bookmark', 'done']),
  data: z.object({
    username: z.string().min(3).max(30).optional(),
    display_name: z.string().max(50).optional(),
    selected_categories: z.array(z.string()).optional(),
    first_bookmark_url: z.string().url().optional(),
  }),
})

export const bookmarkSchema = z.object({
  url: z.string().url('Must be a valid URL').max(2048),
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  category_id: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().max(30)).max(10).optional().default([]),
  is_pinned: z.boolean().optional().default(false),
  is_favorite: z.boolean().optional().default(false),
})

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  description: z.string().max(200).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a hex color'),
  icon: z.string().max(30).optional(),
  parent_id: z.string().uuid().nullable().optional(),
})

export const sharedLinkSchema = z.object({
  title: z.string().max(100).optional(),
  description: z.string().max(300).optional(),
  slug: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens')
    .optional(),
  layout: z.enum(['minimal', 'cards', 'masonry', 'terminal']).optional().default('cards'),
  theme: z.enum(['light', 'dark']).optional().default('light'),
  category_ids: z.array(z.string().uuid()).optional().default([]),
  is_active: z.boolean().optional().default(true),
  show_favicons: z.boolean().optional().default(true),
  show_descriptions: z.boolean().optional().default(true),
  show_tags: z.boolean().optional().default(true),
})

export const searchParamsSchema = z.object({
  query: z.string().max(200).default(''),
  category_id: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).optional(),
  link_status: z.enum(['alive', 'dead', 'redirected', 'timeout', 'unchecked']).optional(),
  is_pinned: z.boolean().optional(),
  is_archived: z.boolean().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'title', 'sort_order']).default('created_at'),
  sort_dir: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().min(10).max(100).default(20),
})

export const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  default_view: z.enum(['stack', 'grid', 'list']).optional(),
  default_category_id: z.string().uuid().nullable().optional(),
  items_per_page: z.number().int().refine(v => [20, 40, 60, 100].includes(v)).optional(),
  show_favicons: z.boolean().optional(),
  show_og_images: z.boolean().optional(),
  compact_mode: z.boolean().optional(),
  email_notifications: z.boolean().optional(),
})

export type ProfileInput = z.infer<typeof profileSchema>
export type OnboardingInput = z.infer<typeof onboardingSchema>
export type BookmarkInput = z.infer<typeof bookmarkSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type SharedLinkInput = z.infer<typeof sharedLinkSchema>
export type SearchParamsInput = z.infer<typeof searchParamsSchema>
export type PreferencesInput = z.infer<typeof preferencesSchema>
