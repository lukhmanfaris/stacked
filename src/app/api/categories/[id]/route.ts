import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response'
import { categorySchema } from '@/lib/validators'
import { generateSlug } from '@/lib/utils'
import { UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/errors'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new UnauthorizedError()

    const body = await request.json()
    const parsed = categorySchema.partial().safeParse(body)
    if (!parsed.success) {
      return apiError('VALIDATION_FAILED', 'Validation failed', 422)
    }

    const updates: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.name) {
      updates.slug = generateSlug(parsed.data.name)
    }

    const { data: category, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return apiError('CONFLICT', 'A category with this name already exists', 409)
      throw error
    }
    if (!category) throw new NotFoundError('Category', id)

    return apiSuccess(category)
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

    // Check it exists and belongs to the user
    const { data: existing } = await supabase
      .from('categories')
      .select('id, is_default')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!existing) throw new NotFoundError('Category', id)
    if (existing.is_default) throw new ForbiddenError('Cannot delete the default category')

    // Orphan children (set parent_id to null) before deleting
    await supabase
      .from('categories')
      .update({ parent_id: null })
      .eq('parent_id', id)
      .eq('user_id', user.id)

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return apiSuccess({ id })
  } catch (err) {
    return handleApiError(err)
  }
}
