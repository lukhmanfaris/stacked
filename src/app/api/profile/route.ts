import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { apiSuccess, handleApiError } from '@/lib/api-response'
import { UnauthorizedError, ConflictError, ValidationError } from '@/lib/errors'
import { profileSchema } from '@/lib/validators'
import { deleteFile, avatarPath } from '@/lib/storage'

/**
 * PATCH /api/profile
 * Update username, display_name, bio.
 * Checks username uniqueness (skips if unchanged).
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new UnauthorizedError()

    const body = await request.json()
    const parsed = profileSchema.partial().safeParse(body)
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map(e => ({ field: String(e.path[0] ?? 'unknown'), message: e.message }))
      )
    }

    const { username, display_name, bio } = parsed.data

    // Check username uniqueness only when it's changing
    if (username) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', user.id)
        .maybeSingle()

      if (existing) throw new ConflictError('Username is already taken')
    }

    const updates: Record<string, unknown> = {}
    if (username !== undefined) updates.username = username
    if (display_name !== undefined) updates.display_name = display_name
    if (bio !== undefined) updates.bio = bio

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error

    return apiSuccess({ profile })
  } catch (err) {
    return handleApiError(err)
  }
}

/**
 * DELETE /api/profile
 * Permanently delete the authenticated user's account.
 * Cascades: profiles → bookmarks, categories (via FK ON DELETE CASCADE).
 * Also removes avatar from storage before deleting auth user.
 */
export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new UnauthorizedError()

    // Remove avatar from storage (best-effort — ignore errors)
    await deleteFile('avatars', avatarPath(user.id), supabase).catch(() => {})

    // Delete auth user — cascades to profiles → bookmarks/categories via FK
    const { error } = await adminClient.auth.admin.deleteUser(user.id)
    if (error) throw error

    return apiSuccess({ deleted: true })
  } catch (err) {
    return handleApiError(err)
  }
}
