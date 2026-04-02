import { createClient } from '@/lib/supabase/server'
import { apiSuccess, handleApiError } from '@/lib/api-response'
import { UnauthorizedError, ValidationError } from '@/lib/errors'
import { preferencesSchema } from '@/lib/validators'

/**
 * PATCH /api/preferences
 * Merge-update the user's preferences JSONB field.
 * Only provided keys are updated — existing keys are preserved.
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new UnauthorizedError()

    const body = await request.json()
    const parsed = preferencesSchema.safeParse(body)
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map(e => ({ field: String(e.path[0] ?? 'unknown'), message: e.message }))
      )
    }

    // Read current preferences then merge — preserves untouched keys
    const { data: current } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', user.id)
      .single()

    const existing = (current?.preferences ?? {}) as Record<string, unknown>
    const merged = { ...existing, ...parsed.data }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({ preferences: merged })
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error

    return apiSuccess({ preferences: profile.preferences })
  } catch (err) {
    return handleApiError(err)
  }
}
