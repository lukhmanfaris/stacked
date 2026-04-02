import { createClient } from '@/lib/supabase/server'
import { apiSuccess, handleApiError } from '@/lib/api-response'
import { UnauthorizedError } from '@/lib/errors'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new UnauthorizedError()

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error || !profile) throw new UnauthorizedError('Profile not found')

    return apiSuccess({ user: { id: user.id, email: user.email }, profile })
  } catch (err) {
    return handleApiError(err)
  }
}
