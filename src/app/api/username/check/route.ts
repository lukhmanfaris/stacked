import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, handleApiError } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'

function generateSuggestions(base: string): string[] {
  return [
    `${base}1`,
    `${base}2`,
    `${base}_`,
    `the_${base}`,
  ]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      throw new ValidationError([{ field: 'username', message: 'username query param is required' }])
    }

    if (username.length < 3 || username.length > 30) {
      return apiSuccess({ available: false, reason: 'Username must be 3–30 characters' })
    }

    if (!/^[a-z0-9_-]+$/.test(username)) {
      return apiSuccess({ available: false, reason: 'Only lowercase letters, numbers, underscores, hyphens' })
    }

    const supabase = await createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    const available = !data
    return apiSuccess({
      available,
      suggestions: available ? undefined : generateSuggestions(username),
    })
  } catch (err) {
    return handleApiError(err)
  }
}
