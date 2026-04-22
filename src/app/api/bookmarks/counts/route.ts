import { createClient } from '@/lib/supabase/server'
import { apiSuccess, handleApiError } from '@/lib/api-response'
import { UnauthorizedError } from '@/lib/errors'
import type { BookmarkCounts } from '@/types/bookmark'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new UnauthorizedError()

    const { data, error } = await supabase.rpc('get_bookmark_counts', {
      p_user_id: user.id,
    })

    if (error) throw error

    // RPC returns JSONB; cast to BookmarkCounts shape
    const counts = (data ?? {
      total: 0,
      favorites: 0,
      archived: 0,
      trashed: 0,
      unsorted: 0,
      by_category: {},
      by_tag: {},
    }) as BookmarkCounts

    return apiSuccess(counts)
  } catch (error) {
    return handleApiError(error)
  }
}
