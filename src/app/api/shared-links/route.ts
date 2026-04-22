import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response'
import { sharedLinkSchema } from '@/lib/validators'
import { generateSlug } from '@/lib/utils'
import { checkTierLimit } from '@/lib/tier'
import { UnauthorizedError, ConflictError } from '@/lib/errors'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new UnauthorizedError()

    const { data, error } = await supabase
      .from('shared_links')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return apiSuccess(data ?? [])
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new UnauthorizedError()

    const body = await request.json()
    const parsed = sharedLinkSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('VALIDATION_FAILED', 'Validation failed', 422)
    }

    await checkTierLimit(user.id, 'shared_links')

    const { title, description, layout, theme, category_ids, is_active, show_favicons, show_descriptions, show_tags } = parsed.data

    // Auto-generate slug from title, or use provided slug, or from timestamp
    const baseSlug = parsed.data.slug ?? (title ? generateSlug(title) : `collection-${Date.now()}`)

    // Ensure slug is unique — append suffix if taken
    let slug = baseSlug
    let attempt = 0
    while (true) {
      const { count } = await supabase
        .from('shared_links')
        .select('id', { count: 'exact', head: true })
        .eq('slug', slug)
      if (count === 0) break
      attempt++
      if (attempt > 5) {
        slug = `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`
        break
      }
      slug = `${baseSlug}-${attempt}`
    }

    const { data: link, error } = await supabase
      .from('shared_links')
      .insert({
        user_id: user.id,
        slug,
        title: title ?? null,
        description: description ?? null,
        layout: layout ?? 'cards',
        theme: theme ?? 'light',
        category_ids: category_ids ?? [],
        is_active: is_active ?? true,
        show_favicons: show_favicons ?? true,
        show_descriptions: show_descriptions ?? true,
        show_tags: show_tags ?? true,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return apiError('CONFLICT', 'A shared link with this slug already exists', 409)
      }
      throw error
    }

    return apiSuccess(link, 201)
  } catch (err) {
    return handleApiError(err)
  }
}
