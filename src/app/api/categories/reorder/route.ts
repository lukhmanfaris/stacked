import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response'
import { UnauthorizedError } from '@/lib/errors'
import { z } from 'zod'

const reorderSchema = z.array(
  z.object({ id: z.string().uuid(), sort_order: z.number().int().min(0) }),
)

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new UnauthorizedError()

    const body = await request.json()
    const parsed = reorderSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('VALIDATION_FAILED', 'Validation failed', 422)
    }

    // Batch update sort_order for each category
    await Promise.all(
      parsed.data.map(({ id, sort_order }) =>
        supabase
          .from('categories')
          .update({ sort_order })
          .eq('id', id)
          .eq('user_id', user.id),
      ),
    )

    return apiSuccess({ reordered: parsed.data.length })
  } catch (err) {
    return handleApiError(err)
  }
}
