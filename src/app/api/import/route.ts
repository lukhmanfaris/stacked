import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response'
import { UnauthorizedError } from '@/lib/errors'
import { generateSlug } from '@/lib/utils'
import type { ParsedBookmark } from '@/lib/import/types'

const parsedBookmarkSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1).max(500),
  description: z.string().max(500).optional(),
  folder: z.string().max(50).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  add_date: z.string().optional(),
})

const importBodySchema = z.object({
  bookmarks: z.array(parsedBookmarkSchema).min(1).max(5000),
  folder_map: z.record(z.string(), z.string().uuid().nullable()),
  duplicate_strategy: z.enum(['skip', 'overwrite', 'create_new']),
})

const BATCH_SIZE = 100

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new UnauthorizedError()

    const body = await request.json()
    const parsed = importBodySchema.safeParse(body)
    if (!parsed.success) {
      return apiError('VALIDATION_FAILED', 'Invalid request body', 422)
    }

    const { bookmarks, folder_map, duplicate_strategy } = parsed.data

    // Resolve folder → category_id, auto-creating categories for null entries
    const categoryIdMap: Record<string, string> = {}

    for (const [folderName, categoryId] of Object.entries(folder_map)) {
      if (categoryId) {
        categoryIdMap[folderName] = categoryId
      } else {
        // Auto-create category
        const slug = generateSlug(folderName)
        const { data: created, error } = await supabase
          .from('categories')
          .insert({
            user_id: user.id,
            name: folderName,
            slug,
            color: '#6b7280',
          })
          .select('id')
          .single()

        if (error) {
          // If conflict (slug taken), try to find the existing one
          if (error.code === '23505') {
            const { data: existing } = await supabase
              .from('categories')
              .select('id')
              .eq('user_id', user.id)
              .eq('slug', slug)
              .maybeSingle()
            if (existing) categoryIdMap[folderName] = existing.id
          } else {
            throw error
          }
        } else if (created) {
          categoryIdMap[folderName] = created.id
        }
      }
    }

    // Get default category fallback
    const { data: defaultCat } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .maybeSingle()
    const defaultCategoryId = defaultCat?.id ?? null

    // Get existing URLs for duplicate detection
    const incomingUrls = bookmarks.map(b => b.url)
    const existingUrls = new Set<string>()

    if (duplicate_strategy !== 'create_new') {
      const batchSize = 500
      for (let i = 0; i < incomingUrls.length; i += batchSize) {
        const batch = incomingUrls.slice(i, i + batchSize)
        const { data: existing } = await supabase
          .from('bookmarks')
          .select('url')
          .eq('user_id', user.id)
          .in('url', batch)
        if (existing) existing.forEach(r => existingUrls.add(r.url))
      }
    }

    // Build insert rows
    type BookmarkInsert = {
      user_id: string
      category_id: string
      url: string
      title: string
      description: string | null
      domain: string
      tags: string[]
    }

    const toInsert: BookmarkInsert[] = []
    const toOverwrite: { url: string; updates: Partial<BookmarkInsert> }[] = []
    let skipped = 0

    for (const bm of bookmarks) {
      const isDuplicate = existingUrls.has(bm.url)

      if (isDuplicate && duplicate_strategy === 'skip') {
        skipped++
        continue
      }

      let domain: string
      try {
        domain = new URL(bm.url).hostname.toLowerCase().replace(/^www\./, '')
      } catch {
        skipped++
        continue
      }

      const categoryId = bm.folder
        ? (categoryIdMap[bm.folder] ?? defaultCategoryId)
        : defaultCategoryId

      if (!categoryId) {
        skipped++
        continue
      }

      const row: BookmarkInsert = {
        user_id: user.id,
        category_id: categoryId,
        url: bm.url,
        title: bm.title,
        description: bm.description ?? null,
        domain,
        tags: bm.tags ?? [],
      }

      if (isDuplicate && duplicate_strategy === 'overwrite') {
        toOverwrite.push({ url: bm.url, updates: row })
      } else {
        toInsert.push(row)
      }
    }

    let imported = 0
    let failed = 0

    // Batch insert new bookmarks
    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const batch = toInsert.slice(i, i + BATCH_SIZE)
      const { error } = await supabase.from('bookmarks').insert(batch)
      if (error) {
        failed += batch.length
      } else {
        imported += batch.length
      }
    }

    // Overwrite existing bookmarks one by one (upsert by URL)
    for (const { url, updates } of toOverwrite) {
      const { error } = await supabase
        .from('bookmarks')
        .update(updates)
        .eq('user_id', user.id)
        .eq('url', url)
      if (error) {
        failed++
      } else {
        imported++
      }
    }

    return apiSuccess({ imported, skipped, failed })
  } catch (err) {
    return handleApiError(err)
  }
}
