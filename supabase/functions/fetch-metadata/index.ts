import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const FETCH_TIMEOUT_MS = 8_000
const ASSET_TIMEOUT_MS = 5_000
const DOMAIN_HASH_LENGTH = 16
const FAVICON_MAX_BYTES = 500 * 1024
const OG_MAX_BYTES = 2048 * 1024
const FAVICON_TTL_DAYS = 90
const OG_TTL_DAYS = 30

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Domain helpers ──────────────────────────────────────────────────────────

function normalizeDomain(raw: string): string {
  return raw.toLowerCase().replace(/^www\./, '').replace(/\.$/, '').trim()
}

async function hashDomain(domain: string): Promise<string> {
  const data = new TextEncoder().encode(normalizeDomain(domain))
  const buf = await crypto.subtle.digest('SHA-256', data)
  const hex = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return hex.slice(0, DOMAIN_HASH_LENGTH)
}

// ─── HTML parsing ────────────────────────────────────────────────────────────

interface ParsedMeta {
  title: string | null
  description: string | null
  faviconHref: string | null
  ogImageRaw: string | null
}

function parseMeta(html: string): ParsedMeta {
  // title
  const titleM = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const title = titleM ? titleM[1].replace(/\s+/g, ' ').trim() : null

  // description
  const descM =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*?)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']*?)["'][^>]+name=["']description["']/i)
  const description = descM ? descM[1].trim() : null

  // og:image
  const ogM =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*?)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']*?)["'][^>]+property=["']og:image["']/i)
  const ogImageRaw = ogM ? ogM[1].trim() : null

  // favicon: apple-touch-icon > shortcut icon > icon
  const iconPatterns = [
    /<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']*?)["']/i,
    /<link[^>]+href=["']([^"']*?)["'][^>]+rel=["']apple-touch-icon["']/i,
    /<link[^>]+rel=["']shortcut icon["'][^>]+href=["']([^"']*?)["']/i,
    /<link[^>]+href=["']([^"']*?)["'][^>]+rel=["']shortcut icon["']/i,
    /<link[^>]+rel=["']icon["'][^>]+href=["']([^"']*?)["']/i,
    /<link[^>]+href=["']([^"']*?)["'][^>]+rel=["']icon["']/i,
  ]
  let faviconHref: string | null = null
  for (const pattern of iconPatterns) {
    const m = html.match(pattern)
    if (m) {
      faviconHref = m[1].trim()
      break
    }
  }

  return { title, description, faviconHref, ogImageRaw }
}

// ─── URL resolution ──────────────────────────────────────────────────────────

function resolveUrl(href: string, base: string): string | null {
  try {
    return new URL(href, base).toString()
  } catch {
    return null
  }
}

// ─── Asset download ──────────────────────────────────────────────────────────

async function downloadAsset(
  url: string,
  maxBytes: number,
): Promise<{ data: Uint8Array; contentType: string } | null> {
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), ASSET_TIMEOUT_MS)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(id)

    if (!res.ok) return null

    const contentType = res.headers.get('content-type') ?? 'application/octet-stream'
    const buf = await res.arrayBuffer()
    if (buf.byteLength > maxBytes) return null

    return { data: new Uint8Array(buf), contentType }
  } catch {
    return null
  }
}

// ─── Fallback favicon SVG ────────────────────────────────────────────────────

const FALLBACK_COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6',
  '#F59E0B', '#EF4444', '#22C55E', '#6366F1',
]

function generateFallbackSvg(domain: string): Uint8Array {
  const initial = (domain[0] ?? '?').toUpperCase()
  const color = FALLBACK_COLORS[domain.charCodeAt(0) % FALLBACK_COLORS.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="${color}"/><text x="32" y="32" font-family="system-ui,sans-serif" font-size="32" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="central">${initial}</text></svg>`
  return new TextEncoder().encode(svg)
}

// ─── TTL check ───────────────────────────────────────────────────────────────

function isFresh(refreshedAt: string | null, ttlDays: number): boolean {
  if (!refreshedAt) return false
  const ageMs = Date.now() - new Date(refreshedAt).getTime()
  return ageMs < ttlDays * 24 * 60 * 60 * 1000
}

// ─── Storage upload ──────────────────────────────────────────────────────────

async function uploadToStorage(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  path: string,
  data: Uint8Array,
  contentType: string,
): Promise<string | null> {
  const { error } = await supabase.storage.from(bucket).upload(path, data, {
    contentType,
    upsert: true,
    cacheControl: '86400',
  })
  if (error) return null
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
  return urlData.publicUrl
}

// ─── Main handler ────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS })
  }

  try {
    let body: { url?: string }
    try {
      body = await req.json()
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers: CORS_HEADERS })
    }

    const rawUrl = body?.url
    if (!rawUrl || typeof rawUrl !== 'string') {
      return Response.json({ error: 'url is required' }, { status: 400, headers: CORS_HEADERS })
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(rawUrl)
    } catch {
      return Response.json({ error: 'Invalid URL' }, { status: 400, headers: CORS_HEADERS })
    }

    // Only allow http/https
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return Response.json({ error: 'Invalid URL protocol' }, { status: 400, headers: CORS_HEADERS })
    }

    const rawDomain = parsedUrl.hostname
    const domain = normalizeDomain(rawDomain)
    const domainHash = await hashDomain(domain)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Check cached domain_assets
    const { data: cached } = await supabase
      .from('domain_assets')
      .select('favicon_url, og_image_url, fetch_failed, favicon_refreshed_at, og_image_refreshed_at')
      .eq('domain_hash', domainHash)
      .maybeSingle()

    const faviconFresh = cached && !cached.fetch_failed && isFresh(cached.favicon_refreshed_at, FAVICON_TTL_DAYS)
    const ogFresh = cached && !cached.fetch_failed && isFresh(cached.og_image_refreshed_at, OG_TTL_DAYS)

    // ─── Fetch HTML ───────────────────────────────────────────────────────────

    let title: string | null = null
    let description: string | null = null
    let faviconHref: string | null = null
    let ogImageRaw: string | null = null
    let finalUrl = parsedUrl.toString()

    const MAX_REDIRECTS = 3
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    try {
      let currentUrl = parsedUrl.toString()
      let redirectCount = 0
      let res: Response | null = null

      while (redirectCount <= MAX_REDIRECTS) {
        res = await fetch(currentUrl, {
          signal: controller.signal,
          redirect: 'manual',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Stacked/1.0; +https://stacked.app)',
            Accept: 'text/html,application/xhtml+xml,*/*;q=0.9',
          },
        })

        if (res.status >= 300 && res.status < 400) {
          const location = res.headers.get('location')
          if (!location || redirectCount >= MAX_REDIRECTS) break
          currentUrl = resolveUrl(location, currentUrl) ?? currentUrl
          redirectCount++
          continue
        }

        break
      }

      clearTimeout(timeoutId)

      if (res) {
        finalUrl = currentUrl // res.url is empty in redirect:'manual' mode
        const contentType = res.headers.get('content-type') ?? ''

        if (contentType.includes('text/html')) {
          const html = await res.text()
          const meta = parseMeta(html)
          title = meta.title
          description = meta.description
          faviconHref = meta.faviconHref
          ogImageRaw = meta.ogImageRaw
        }
      }
    } catch (_err) {
      clearTimeout(timeoutId)
      // Timeout or network error — fall through with nulls
    }

    // ─── Cache favicon ────────────────────────────────────────────────────────

    let faviconStorageUrl: string | null = faviconFresh ? (cached?.favicon_url ?? null) : null

    if (!faviconFresh) {
      const faviconAbsUrl = faviconHref
        ? resolveUrl(faviconHref, finalUrl)
        : `${parsedUrl.protocol}//${parsedUrl.host}/favicon.ico`

      if (faviconAbsUrl) {
        const asset = await downloadAsset(faviconAbsUrl, FAVICON_MAX_BYTES)
        if (asset) {
          faviconStorageUrl = await uploadToStorage(
            supabase,
            'favicons',
            `${domainHash}.png`,
            asset.data,
            asset.contentType,
          )
        }
      }

      // Fallback: generate SVG with domain initial
      if (!faviconStorageUrl) {
        const svgBytes = generateFallbackSvg(domain)
        faviconStorageUrl = await uploadToStorage(
          supabase,
          'favicons',
          `${domainHash}.png`,
          svgBytes,
          'image/svg+xml',
        )
      }
    }

    // ─── Cache OG image ───────────────────────────────────────────────────────

    let ogStorageUrl: string | null = ogFresh ? (cached?.og_image_url ?? null) : null

    if (!ogFresh && ogImageRaw) {
      const ogAbsUrl = resolveUrl(ogImageRaw, finalUrl)
      if (ogAbsUrl) {
        const asset = await downloadAsset(ogAbsUrl, OG_MAX_BYTES)
        if (asset) {
          ogStorageUrl = await uploadToStorage(
            supabase,
            'og-images',
            `${domainHash}.webp`,
            asset.data,
            asset.contentType,
          )
        }
      }
    }

    // ─── Upsert domain_assets ─────────────────────────────────────────────────

    const now = new Date().toISOString()
    // fetch_failed = true only when storage is completely unavailable and we
    // couldn't persist even the fallback SVG favicon. M3 checks this flag via
    // checkDomainAssetStatus() to decide whether to retry.
    const fetchFailed = !faviconFresh && faviconStorageUrl === null
    const upsertPayload: Record<string, unknown> = {
      domain_hash: domainHash,
      domain,
      fetch_failed: fetchFailed,
      fetch_attempted_at: now,
      orphaned_at: null,
    }
    if (faviconStorageUrl && !faviconFresh) {
      upsertPayload.favicon_url = faviconStorageUrl
      upsertPayload.favicon_refreshed_at = now
    }
    if (ogStorageUrl && !ogFresh) {
      upsertPayload.og_image_url = ogStorageUrl
      upsertPayload.og_image_refreshed_at = now
    }

    const { error: upsertError } = await supabase
      .from('domain_assets')
      .upsert(upsertPayload, { onConflict: 'domain_hash' })

    if (upsertError) {
      console.error('[fetch-metadata] domain_assets upsert failed:', upsertError.message)
      // Do not throw — return what we fetched so the caller can display title/description
    }

    return Response.json(
      { title, description, favicon_url: faviconStorageUrl, og_image_url: ogStorageUrl, domain },
      { headers: CORS_HEADERS },
    )
  } catch (err) {
    console.error('[fetch-metadata] unexpected error:', err)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS },
    )
  }
})
