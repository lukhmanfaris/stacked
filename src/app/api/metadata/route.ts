import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response'
import { UnauthorizedError, ValidationError, RateLimitError } from '@/lib/errors'

// ─── In-memory rate limiter (30 req/user/min) ────────────────────────────────
// NOTE: Resets on cold start in serverless deployments — best-effort for MVP.
// For production hardening, migrate to Supabase-backed or Upstash Redis rate limiting.

const rateMap = new Map<string, { count: number; windowStart: number }>()
const RATE_LIMIT = 30
const RATE_WINDOW_MS = 60_000

// Purge expired entries every 5 minutes to prevent unbounded map growth
setInterval(() => {
  const now = Date.now()
  for (const [userId, entry] of rateMap) {
    if (now - entry.windowStart > RATE_WINDOW_MS) rateMap.delete(userId)
  }
}, 5 * 60 * 1000)

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(userId)

  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateMap.set(userId, { count: 1, windowStart: now })
    return true
  }

  if (entry.count >= RATE_LIMIT) return false

  entry.count++
  return true
}

// ─── Metadata response shape ─────────────────────────────────────────────────

interface MetadataResult {
  title: string | null
  description: string | null
  favicon_url: string | null
  og_image_url: string | null
  domain: string
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new UnauthorizedError()

    if (!checkRateLimit(user.id)) {
      throw new RateLimitError('Metadata fetch limit reached. Try again in a minute.')
    }

    let body: { url?: string }
    try {
      body = await request.json()
    } catch {
      throw new ValidationError([{ field: 'url', message: 'Invalid JSON body' }])
    }

    const url = body?.url
    if (!url || typeof url !== 'string') {
      throw new ValidationError([{ field: 'url', message: 'url is required' }])
    }

    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error()
      }
    } catch {
      throw new ValidationError([{ field: 'url', message: 'Must be a valid http/https URL' }])
    }

    const { data, error } = await adminClient.functions.invoke<MetadataResult>(
      'fetch-metadata',
      { body: { url } },
    )

    if (error) {
      console.error('[api/metadata] edge function error:', error)
      return apiError('METADATA_FETCH_FAILED', 'Failed to fetch metadata', 502)
    }

    return apiSuccess(data)
  } catch (error) {
    return handleApiError(error)
  }
}
