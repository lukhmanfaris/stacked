import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response'
import { UnauthorizedError, ValidationError } from '@/lib/errors'
import { checkTierLimit } from '@/lib/tier'
import { bookmarkSchema } from '@/lib/validators'
import type { BookmarkFilters, BookmarkListResponse, CreateBookmarkResponse } from '@/types/bookmark'

// ─── GET /api/bookmarks ───────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new UnauthorizedError()

    const { searchParams } = new URL(request.url)

    const filters: BookmarkFilters = {
      category_id: searchParams.get('category_id') || undefined,
      is_pinned: searchParams.has('is_pinned') ? searchParams.get('is_pinned') === 'true' : undefined,
      is_archived: searchParams.has('is_archived') ? searchParams.get('is_archived') === 'true' : false,
      link_status: (searchParams.get('link_status') as BookmarkFilters['link_status']) || undefined,
      sort_by: (searchParams.get('sort_by') as BookmarkFilters['sort_by']) || 'created_at',
      sort_dir: (searchParams.get('sort_dir') as BookmarkFilters['sort_dir']) || 'desc',
      page: Math.max(1, parseInt(searchParams.get('page') ?? '1', 10)),
      per_page: Math.min(100, Math.max(10, parseInt(searchParams.get('per_page') ?? '20', 10))),
    }

    const tagsParam = searchParams.get('tags')
    if (tagsParam) {
      const tagList = tagsParam.split(',').map(t => t.trim()).filter(Boolean)
      const parsedTags = z.array(z.string().max(50)).max(20).safeParse(tagList)
      if (parsedTags.success) filters.tags = parsedTags.data
    }

    const per_page = filters.per_page!
    const page = filters.page!
    const from = (page - 1) * per_page
    const to = from + per_page - 1

    let query = supabase
      .from('bookmarks')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    if (filters.category_id) query = query.eq('category_id', filters.category_id)
    if (filters.is_pinned !== undefined) query = query.eq('is_pinned', filters.is_pinned)
    if (filters.is_archived !== undefined) query = query.eq('is_archived', filters.is_archived)
    if (filters.link_status) query = query.eq('link_status', filters.link_status)
    if (filters.tags?.length) query = query.contains('tags', filters.tags)

    // Pinned bookmarks always sort first, then by requested field
    const ascending = filters.sort_dir === 'asc'
    query = query
      .order('is_pinned', { ascending: false })
      .order(filters.sort_by!, { ascending })
      .range(from, to)

    const { data: bookmarks, error, count } = await query

    if (error) throw error

    const total = count ?? 0
    const result: BookmarkListResponse = {
      bookmarks: bookmarks ?? [],
      total,
      page,
      per_page,
      has_next: from + per_page < total,
    }

    return apiSuccess(result)
  } catch (error) {
    return handleApiError(error)
  }
}

// ─── POST /api/bookmarks ──────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new UnauthorizedError()

    const body = await request.json()
    const parsed = bookmarkSchema.safeParse(body)
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message }))
      )
    }

    await checkTierLimit(user.id, 'bookmarks')

    const { url, title: titleOverride, description: descOverride, category_id, tags, is_pinned } = parsed.data

    // Extract domain from URL
    const domain = new URL(url).hostname.toLowerCase().replace(/^www\./, '')

    // Fetch metadata from edge function (non-blocking — failures are graceful)
    let metaTitle: string | null = null
    let metaDescription: string | null = null
    let faviconUrl: string | null = null
    let ogImageUrl: string | null = null

    const { data: meta } = await adminClient.functions.invoke<{
      title: string | null
      description: string | null
      favicon_url: string | null
      og_image_url: string | null
    }>('fetch-metadata', { body: { url } })

    if (meta) {
      metaTitle = meta.title
      metaDescription = meta.description
      faviconUrl = meta.favicon_url
      ogImageUrl = meta.og_image_url
    }

    const finalTitle = titleOverride || metaTitle || domain
    const finalDescription = descOverride ?? metaDescription ?? null

    // Check for duplicate URL (warn, don't block)
    const { data: existing } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('url', url)
      .maybeSingle()

    const { data: bookmark, error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: user.id,
        category_id,
        url,
        title: finalTitle,
        description: finalDescription,
        domain,
        tags: tags ?? [],
        favicon_url: faviconUrl,
        og_image_url: ogImageUrl,
        is_pinned: is_pinned ?? false,
      })
      .select()
      .single()

    if (error) throw error

    const result: CreateBookmarkResponse = {
      bookmark,
      duplicate_warning: !!existing,
      existing_id: existing?.id ?? null,
    }

    return apiSuccess(result, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
