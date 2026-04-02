import { createClient } from '@/lib/supabase/server'
import { apiSuccess, handleApiError } from '@/lib/api-response'
import { UnauthorizedError, NotFoundError, ValidationError } from '@/lib/errors'
import { bookmarkSchema } from '@/lib/validators'

// ─── GET /api/bookmarks/[id] ──────────────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new UnauthorizedError()

    const { data: bookmark, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw error
    if (!bookmark) throw new NotFoundError('Bookmark', id)

    return apiSuccess(bookmark)
  } catch (error) {
    return handleApiError(error)
  }
}

// ─── PATCH /api/bookmarks/[id] ────────────────────────────────────────────────

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new UnauthorizedError()

    // Verify ownership
    const { data: existing } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!existing) throw new NotFoundError('Bookmark', id)

    const body = await request.json()
    const parsed = bookmarkSchema.partial().safeParse(body)
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message }))
      )
    }

    const { data: bookmark, error } = await supabase
      .from('bookmarks')
      .update(parsed.data)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return apiSuccess(bookmark)
  } catch (error) {
    return handleApiError(error)
  }
}

// ─── DELETE /api/bookmarks/[id] ───────────────────────────────────────────────

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new UnauthorizedError()

    // Fetch domain before delete (needed for maybe_orphan_domain)
    const { data: bookmark } = await supabase
      .from('bookmarks')
      .select('id, domain')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!bookmark) throw new NotFoundError('Bookmark', id)

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    // Wire M9's orphan-detection function
    await supabase.rpc('maybe_orphan_domain', { p_domain: bookmark.domain })

    return apiSuccess({ id })
  } catch (error) {
    return handleApiError(error)
  }
}
