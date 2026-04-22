import { createClient } from '@/lib/supabase/server'
import { apiError, handleApiError } from '@/lib/api-response'
import { UnauthorizedError } from '@/lib/errors'
import { exportToHtml } from '@/lib/export/to-html'
import { exportToJson } from '@/lib/export/to-json'
import { exportToCsv } from '@/lib/export/to-csv'
import type { Bookmark } from '@/types/bookmark'
import type { Category } from '@/types/category'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new UnauthorizedError()

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') ?? 'json'
    const categoryIds = searchParams.get('category_ids')
      ?.split(',')
      .map(s => s.trim())
      .filter(Boolean) ?? []

    if (!['json', 'html', 'csv'].includes(format)) {
      return apiError('INVALID_FORMAT', 'format must be json, html, or csv', 400)
    }

    // Fetch bookmarks in batches to avoid OOM on large datasets
    const BATCH_SIZE = 1000
    const allBookmarks: Bookmark[] = []
    let offset = 0

    while (true) {
      let q = supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + BATCH_SIZE - 1)

      if (categoryIds.length > 0) {
        q = q.in('category_id', categoryIds)
      }

      const { data, error: bmError } = await q
      if (bmError) throw bmError
      if (!data || data.length === 0) break

      allBookmarks.push(...(data as unknown as Bookmark[]))
      if (data.length < BATCH_SIZE) break
      offset += BATCH_SIZE
    }

    // Fetch categories for name resolution
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
    if (catError) throw catError

    const bms = allBookmarks
    const cats = (categories ?? []) as unknown as Category[]

    let body: string
    let contentType: string
    let ext: string

    if (format === 'html') {
      body = exportToHtml(bms, cats)
      contentType = 'text/html; charset=utf-8'
      ext = 'html'
    } else if (format === 'csv') {
      body = exportToCsv(bms, cats)
      contentType = 'text/csv; charset=utf-8'
      ext = 'csv'
    } else {
      body = exportToJson(bms, cats)
      contentType = 'application/json; charset=utf-8'
      ext = 'json'
    }

    const date = new Date().toISOString().slice(0, 10)
    const filename = `stacked-export-${date}.${ext}`

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
