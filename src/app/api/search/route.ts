import { createClient } from '@/lib/supabase/server'
import { apiSuccess, handleApiError } from '@/lib/api-response'
import { UnauthorizedError, ValidationError } from '@/lib/errors'
import { searchParamsSchema } from '@/lib/validators'
import type { Bookmark } from '@/types/bookmark'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new UnauthorizedError()

    const { searchParams } = new URL(request.url)

    const raw = {
      query:       searchParams.get('query') ?? '',
      category_id: searchParams.get('category_id') ?? undefined,
      tags:        searchParams.get('tags')?.split(',').map(t => t.trim()).filter(Boolean),
      link_status: searchParams.get('link_status') ?? undefined,
      is_pinned:   searchParams.has('is_pinned') ? searchParams.get('is_pinned') === 'true' : undefined,
      is_archived: searchParams.has('is_archived') ? searchParams.get('is_archived') === 'true' : undefined,
      date_from:   searchParams.get('date_from') ?? undefined,
      date_to:     searchParams.get('date_to') ?? undefined,
      sort_by:     searchParams.get('sort_by') ?? undefined,
      sort_dir:    searchParams.get('sort_dir') ?? undefined,
      page:        searchParams.get('page') ?? undefined,
      per_page:    searchParams.get('per_page') ?? undefined,
    }

    const parsed = searchParamsSchema.safeParse(raw)
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message }))
      )
    }

    const {
      query, category_id, tags, link_status, is_pinned, is_archived,
      date_from, date_to, sort_by, sort_dir, page, per_page,
    } = parsed.data

    const from = (page - 1) * per_page
    const to   = from + per_page - 1

    // Select all bookmark columns, explicitly excluding search_vec
    let q = supabase
      .from('bookmarks')
      .select(
        'id,user_id,category_id,url,title,description,domain,tags,' +
        'favicon_url,og_image_url,is_pinned,is_archived,is_favorite,deleted_at,link_status,' +
        'sort_order,created_at,updated_at',
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .is('deleted_at', null)

    // Full-text search — only when query is non-empty
    if (query.trim()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      q = (q as any).textSearch('search_vec', query, { config: 'english', type: 'plain' })
    }

    if (category_id)             q = q.eq('category_id', category_id)
    if (tags?.length)             q = q.contains('tags', tags)
    if (link_status)              q = q.eq('link_status', link_status)
    if (is_pinned !== undefined)  q = q.eq('is_pinned', is_pinned)
    if (date_from)                q = q.gte('created_at', date_from)
    if (date_to)                  q = q.lte('created_at', date_to)

    // Default: hide archived unless explicitly requested
    q = q.eq('is_archived', is_archived ?? false)

    const ascending = sort_dir === 'asc'
    q = q
      .order('is_pinned', { ascending: false })
      .order(sort_by, { ascending })
      .range(from, to)

    const { data: rows, error, count } = await q
    if (error) throw error

    const total = count ?? 0
    return apiSuccess({
      results: (rows ?? []) as unknown as Bookmark[],
      total,
      page,
      per_page,
      has_next: from + per_page < total,
      query,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
