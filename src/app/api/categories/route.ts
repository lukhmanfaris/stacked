import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response'
import { categorySchema } from '@/lib/validators'
import { generateSlug } from '@/lib/utils'
import { checkTierLimit } from '@/lib/tier'
import { UnauthorizedError } from '@/lib/errors'
import type { CategoryTree } from '@/types/category'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new UnauthorizedError()

    const { data: rows, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })

    if (error) throw error

    // Build tree: roots first, then attach children
    const roots: CategoryTree[] = []
    const childMap: Record<string, CategoryTree[]> = {}

    for (const row of rows ?? []) {
      if (row.parent_id) {
        if (!childMap[row.parent_id]) childMap[row.parent_id] = []
        childMap[row.parent_id].push({ ...row, children: [] })
      } else {
        roots.push({ ...row, children: [] })
      }
    }

    for (const root of roots) {
      root.children = childMap[root.id] ?? []
    }

    return apiSuccess(roots)
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
    const parsed = categorySchema.safeParse(body)
    if (!parsed.success) {
      return apiError('VALIDATION_FAILED', 'Validation failed', 422)
    }

    await checkTierLimit(user.id, 'categories')

    const { name, description, color, icon, parent_id } = parsed.data
    const slug = generateSlug(name)

    // Get next sort_order
    const { count } = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        user_id: user.id,
        name,
        slug,
        description: description ?? null,
        color,
        icon: icon ?? null,
        parent_id: parent_id ?? null,
        sort_order: count ?? 0,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return apiError('CONFLICT', 'A category with this name already exists', 409)
      }
      throw error
    }

    return apiSuccess(category, 201)
  } catch (err) {
    return handleApiError(err)
  }
}
