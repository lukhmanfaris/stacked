import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response'
import { UnauthorizedError } from '@/lib/errors'
import { parseNetscapeHtml } from '@/lib/import/parse-html'
import { parseStackedJson } from '@/lib/import/parse-json'
import { parseCsv } from '@/lib/import/parse-csv'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new UnauthorizedError()

    const contentType = request.headers.get('content-type') ?? ''
    if (!contentType.includes('multipart/form-data')) {
      return apiError('INVALID_CONTENT_TYPE', 'Expected multipart/form-data', 400)
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return apiError('MISSING_FILE', 'No file provided', 400)
    }

    if (file.size > MAX_FILE_SIZE) {
      return apiError('FILE_TOO_LARGE', 'File must be under 10 MB', 413)
    }

    const text = await file.text()
    const name = file.name.toLowerCase()

    let result
    if (name.endsWith('.html') || name.endsWith('.htm')) {
      result = parseNetscapeHtml(text)
    } else if (name.endsWith('.json')) {
      result = parseStackedJson(text)
    } else if (name.endsWith('.csv')) {
      result = parseCsv(text)
    } else {
      return apiError('UNSUPPORTED_FORMAT', 'Supported formats: .html, .htm, .json, .csv', 415)
    }

    if (result.error) {
      return apiError('PARSE_ERROR', result.error, 422)
    }

    // Count duplicates (URLs already in user's library)
    const urls = result.bookmarks.map(b => b.url)
    let duplicate_count = 0

    if (urls.length > 0) {
      // Check in batches of 500 to stay within Supabase URL limits
      const batchSize = 500
      for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize)
        const { count } = await supabase
          .from('bookmarks')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('url', batch)
        duplicate_count += count ?? 0
      }
    }

    return apiSuccess({
      bookmarks: result.bookmarks,
      folders: result.folders,
      duplicate_count,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
