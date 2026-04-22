import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response'
import { sharedLinkSchema } from '@/lib/validators'
import { UnauthorizedError, NotFoundError, ForbiddenError } from '@/lib/errors'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new UnauthorizedError()

    const { data: link, error } = await supabase
      .from('shared_links')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !link) throw new NotFoundError('Shared link', id)

    return apiSuccess(link)
  } catch (err) {
    return handleApiError(err)
  }
}

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
      .from('shared_links')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (!existing) throw new NotFoundError('Shared link', id)
    if (existing.user_id !== user.id) throw new ForbiddenError()

    const body = await request.json()
    const parsed = sharedLinkSchema.partial().safeParse(body)
    if (!parsed.success) {
      return apiError('VALIDATION_FAILED', 'Validation failed', 422)
    }

    const { data: link, error } = await supabase
      .from('shared_links')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return apiError('CONFLICT', 'A shared link with this slug already exists', 409)
      }
      throw error
    }

    return apiSuccess(link)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new UnauthorizedError()

    const { data: existing } = await supabase
      .from('shared_links')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (!existing) throw new NotFoundError('Shared link', id)
    if (existing.user_id !== user.id) throw new ForbiddenError()

    const { error } = await supabase
      .from('shared_links')
      .delete()
      .eq('id', id)

    if (error) throw error

    return apiSuccess({ id })
  } catch (err) {
    return handleApiError(err)
  }
}
