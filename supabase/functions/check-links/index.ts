import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const BATCH_SIZE = 50
const BATCH_DELAY_MS = 1_000
const HEAD_TIMEOUT_MS = 10_000
const STALE_DAYS = 7

type LinkStatus = 'alive' | 'dead' | 'redirected' | 'timeout' | 'unchecked'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── URL check ───────────────────────────────────────────────────────────────

async function checkUrl(url: string): Promise<LinkStatus> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), HEAD_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'manual', // detect redirects without following
      headers: { 'User-Agent': 'Stacked-LinkChecker/1.0' },
    })
    clearTimeout(timer)
    if (res.status >= 200 && res.status < 300) return 'alive'
    if (res.status === 301 || res.status === 302 || res.status === 308) return 'redirected'
    if (res.status === 404 || res.status >= 500) return 'dead'
    // Other 3xx without redirect — treat as redirected
    if (res.status >= 300 && res.status < 400) return 'redirected'
    return 'dead'
  } catch (err) {
    clearTimeout(timer)
    if ((err as Error).name === 'AbortError') return 'timeout'
    return 'dead'
  }
}

// ─── Batch processing ────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function processBatch(
  supabase: ReturnType<typeof createClient>,
  bookmarks: Array<{ id: string; url: string }>
): Promise<{ checked: number; errors: number }> {
  let checked = 0
  let errors = 0

  await Promise.allSettled(
    bookmarks.map(async ({ id, url }) => {
      const status = await checkUrl(url)
      const { error } = await supabase
        .from('bookmarks')
        .update({
          link_status: status,
          last_checked_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) {
        console.error(`Failed to update bookmark ${id}:`, error.message)
        errors++
      } else {
        checked++
      }
    })
  )

  return { checked, errors }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  // Verify the request is from Supabase scheduler or an authorized caller
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const staleThreshold = new Date(
    Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000
  ).toISOString()

  // Fetch all stale bookmarks (not deleted, not trashed)
  const { data: bookmarks, error: fetchError } = await supabase
    .from('bookmarks')
    .select('id, url')
    .is('deleted_at', null)
    .or(`last_checked_at.is.null,last_checked_at.lt.${staleThreshold}`)
    .order('last_checked_at', { ascending: true, nullsFirst: true })

  if (fetchError) {
    console.error('Failed to fetch stale bookmarks:', fetchError.message)
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const all = bookmarks ?? []
  let totalChecked = 0
  let totalErrors = 0

  // Process in batches with delay between each
  for (let i = 0; i < all.length; i += BATCH_SIZE) {
    const batch = all.slice(i, i + BATCH_SIZE)
    const { checked, errors } = await processBatch(supabase, batch)
    totalChecked += checked
    totalErrors += errors

    if (i + BATCH_SIZE < all.length) {
      await delay(BATCH_DELAY_MS)
    }
  }

  console.log(`Link check complete: ${totalChecked} checked, ${totalErrors} errors`)

  return new Response(
    JSON.stringify({
      total: all.length,
      checked: totalChecked,
      errors: totalErrors,
    }),
    {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    }
  )
})
