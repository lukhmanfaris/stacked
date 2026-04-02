import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, handleApiError } from '@/lib/api-response'
import { UnauthorizedError, ValidationError } from '@/lib/errors'
import { onboardingSchema } from '@/lib/validators'
import { STARTER_CATEGORIES, DEFAULT_CATEGORY } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new UnauthorizedError()

    const body = await request.json()
    const parsed = onboardingSchema.safeParse(body)
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message }))
      )
    }

    const { step, data } = parsed.data

    if (step === 'username') {
      const { username, display_name } = data
      if (!username) throw new ValidationError([{ field: 'username', message: 'Username is required' }])

      // Check uniqueness (race-safe: DB has unique constraint)
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', user.id)
        .maybeSingle()

      if (existing) throw new ValidationError([{ field: 'username', message: 'Username is already taken' }])

      const { error } = await supabase
        .from('profiles')
        .update({ username, display_name: display_name || null, onboarding_step: 'categories' })
        .eq('id', user.id)
      if (error) throw new Error(error.message)

      return apiSuccess({ step: 'categories' })
    }

    if (step === 'categories') {
      const selected = data.selected_categories ?? []
      if (selected.length === 0) throw new ValidationError([{ field: 'selected_categories', message: 'Select at least one category' }])

      // Create default General category first
      const defaultRow = {
        user_id: user.id,
        name: DEFAULT_CATEGORY.name,
        slug: 'general',
        color: DEFAULT_CATEGORY.color,
        icon: DEFAULT_CATEGORY.icon,
        is_default: true,
        sort_order: -1,
      }

      const categoryRows = selected.map((name, i) => {
        const cat = STARTER_CATEGORIES.find(c => c.name === name)!
        return {
          user_id: user.id,
          name: cat.name,
          slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
          color: cat.color,
          icon: cat.icon,
          sort_order: i,
          is_default: false,
        }
      })

      const { error } = await supabase
        .from('categories')
        .upsert([defaultRow, ...categoryRows], { onConflict: 'user_id,slug' })
      if (error) throw new Error(error.message)

      await supabase
        .from('profiles')
        .update({ onboarding_step: 'first_bookmark' })
        .eq('id', user.id)

      return apiSuccess({ step: 'first_bookmark' })
    }

    if (step === 'first_bookmark') {
      const { first_bookmark_url } = data

      if (first_bookmark_url) {
        // Find the user's default category for the first bookmark
        const { data: defaultCat } = await supabase
          .from('categories')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .maybeSingle()

        if (defaultCat) {
          const domain = (() => {
            try { return new URL(first_bookmark_url).hostname.toLowerCase().replace(/^www\./, '') }
            catch { return first_bookmark_url }
          })()

          const { error: insertError } = await supabase.from('bookmarks').insert({
            user_id: user.id,
            category_id: defaultCat.id,
            url: first_bookmark_url,
            title: domain,
            domain,
          })
          if (insertError) throw new Error(insertError.message)
        }
      }

      await supabase
        .from('profiles')
        .update({ onboarding_step: 'done' })
        .eq('id', user.id)

      return apiSuccess({ step: 'done' })
    }

    return apiSuccess({ step })
  } catch (err) {
    return handleApiError(err)
  }
}
