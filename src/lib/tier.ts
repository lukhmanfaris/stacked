import { createClient } from '@/lib/supabase/server'
import { TIER_LIMITS } from '@/types/profile'
import { TierLimitError, UnauthorizedError } from './errors'

type TierResource = 'bookmarks' | 'categories' | 'shared_links'

const resourceCountQuery: Record<TierResource, (userId: string) => Promise<number>> = {
  bookmarks: async (userId) => {
    const supabase = await createClient()
    const { count } = await supabase
      .from('bookmarks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_archived', false)
      .is('deleted_at', null)
    return count ?? 0
  },
  categories: async (userId) => {
    const supabase = await createClient()
    const { count } = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    return count ?? 0
  },
  shared_links: async (userId) => {
    const supabase = await createClient()
    const { count } = await supabase
      .from('shared_links')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    return count ?? 0
  },
}

export async function checkTierLimit(
  userId: string,
  resource: TierResource,
): Promise<void> {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', userId)
    .single()

  if (!profile) throw new UnauthorizedError()

  const VALID_TIERS = ['free', 'pro'] as const
  type Tier = typeof VALID_TIERS[number]
  const tier: Tier = (VALID_TIERS as readonly string[]).includes(profile.tier)
    ? (profile.tier as Tier)
    : 'free'
  const limits = TIER_LIMITS[tier]
  const limitKey = `max_${resource}` as keyof typeof limits
  const limit = limits[limitKey] as number

  const current = await resourceCountQuery[resource](userId)

  if (current >= limit) {
    throw new TierLimitError(resource, limit, current)
  }
}
