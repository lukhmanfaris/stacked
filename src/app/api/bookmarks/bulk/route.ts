import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, handleApiError } from '@/lib/api-response'
import { UnauthorizedError, ValidationError } from '@/lib/errors'

const bulkActionSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
  action: z.discriminatedUnion('type', [
    z.object({ type: z.literal('move'), category_id: z.string().uuid().nullable() }),
    z.object({ type: z.literal('delete') }),       // soft-delete (Trash)
    z.object({ type: z.literal('trash') }),        // alias of delete
    z.object({ type: z.literal('restore') }),      // restore from Trash
    z.object({ type: z.literal('hard_delete') }),  // permanent delete
    z.object({ type: z.literal('archive') }),
    z.object({ type: z.literal('unarchive') }),
    z.object({ type: z.literal('pin') }),
    z.object({ type: z.literal('unpin') }),
    z.object({ type: z.literal('favorite') }),
    z.object({ type: z.literal('unfavorite') }),
    z.object({ type: z.literal('tag'), tags: z.array(z.string().max(30)).max(10) }),
  ]),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new UnauthorizedError()

    const body = await request.json()
    const parsed = bulkActionSchema.safeParse(body)
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message }))
      )
    }

    const { ids, action } = parsed.data

    switch (action.type) {
      case 'move': {
        const { error } = await supabase
          .from('bookmarks')
          .update({ category_id: action.category_id })
          .in('id', ids)
          .eq('user_id', user.id)
        if (error) throw error
        break
      }

      case 'delete':
      case 'trash': {
        const { error } = await supabase
          .from('bookmarks')
          .update({ deleted_at: new Date().toISOString() })
          .in('id', ids)
          .eq('user_id', user.id)
        if (error) throw error
        break
      }

      case 'restore': {
        const { error } = await supabase
          .from('bookmarks')
          .update({ deleted_at: null })
          .in('id', ids)
          .eq('user_id', user.id)
        if (error) throw error
        break
      }

      case 'hard_delete': {
        // Collect domains before deletion for orphan detection
        const { data: toDelete } = await supabase
          .from('bookmarks')
          .select('domain')
          .in('id', ids)
          .eq('user_id', user.id)

        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .in('id', ids)
          .eq('user_id', user.id)
        if (error) throw error

        // Fire-and-forget orphan detection for unique domains
        const uniqueDomains = [...new Set((toDelete ?? []).map(b => b.domain))]
        await Promise.allSettled(
          uniqueDomains.map(d => supabase.rpc('maybe_orphan_domain', { p_domain: d }))
        )
        break
      }

      case 'favorite': {
        const { error } = await supabase
          .from('bookmarks')
          .update({ is_favorite: true })
          .in('id', ids)
          .eq('user_id', user.id)
        if (error) throw error
        break
      }

      case 'unfavorite': {
        const { error } = await supabase
          .from('bookmarks')
          .update({ is_favorite: false })
          .in('id', ids)
          .eq('user_id', user.id)
        if (error) throw error
        break
      }

      case 'archive': {
        const { error } = await supabase
          .from('bookmarks')
          .update({ is_archived: true, is_pinned: false })
          .in('id', ids)
          .eq('user_id', user.id)
        if (error) throw error
        break
      }

      case 'unarchive': {
        const { error } = await supabase
          .from('bookmarks')
          .update({ is_archived: false })
          .in('id', ids)
          .eq('user_id', user.id)
        if (error) throw error
        break
      }

      case 'pin': {
        const { error } = await supabase
          .from('bookmarks')
          .update({ is_pinned: true })
          .in('id', ids)
          .eq('user_id', user.id)
        if (error) throw error
        break
      }

      case 'unpin': {
        const { error } = await supabase
          .from('bookmarks')
          .update({ is_pinned: false })
          .in('id', ids)
          .eq('user_id', user.id)
        if (error) throw error
        break
      }

      case 'tag': {
        // Merge provided tags into existing tags (array union)
        const { data: rows } = await supabase
          .from('bookmarks')
          .select('id, tags')
          .in('id', ids)
          .eq('user_id', user.id)

        if (rows?.length) {
          const updates = rows.map(row => ({
            id: row.id,
            tags: [...new Set([...row.tags, ...action.tags])],
          }))
          const tagErrors: string[] = []
          for (const { id, tags } of updates) {
            const { error } = await supabase
              .from('bookmarks')
              .update({ tags })
              .eq('id', id)
              .eq('user_id', user.id)
            if (error) tagErrors.push(`${id}: ${error.message}`)
          }
          if (tagErrors.length > 0) throw new Error(`Tag update failed for: ${tagErrors.join('; ')}`)
        }
        break
      }
    }

    return apiSuccess({ affected: ids.length })
  } catch (error) {
    return handleApiError(error)
  }
}
