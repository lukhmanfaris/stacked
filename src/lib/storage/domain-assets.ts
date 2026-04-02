import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { LIMITS } from '@/lib/constants'
import { faviconPath, ogImagePath, getPublicUrl } from './index'
import type { DomainAsset, DomainAssetStatus } from './types'

// ─── Domain normalization ─────────────────────────────────────────────────────

/**
 * Normalize a domain for consistent hashing.
 * - Lowercase
 * - Strip "www." prefix
 * - Strip trailing dot
 */
export function normalizeDomain(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^www\./, '')
    .replace(/\.$/, '')
    .trim()
}

/**
 * Compute a deterministic 16-char hex key from a domain.
 * Uses Web Crypto API — safe in Node 18+, Edge Runtime, and browser.
 *
 * Example: "github.com" → "4d97144e5e..."[0:16]
 */
export async function hashDomain(domain: string): Promise<string> {
  const normalized = normalizeDomain(domain)
  const encoder = new TextEncoder()
  const data = encoder.encode(normalized)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hex.slice(0, LIMITS.DOMAIN_HASH_LENGTH)
}

// ─── Status checks ────────────────────────────────────────────────────────────

/**
 * Check whether a domain's favicon or OG image is fresh, stale, or missing.
 *
 * Queries the domain_assets table — not a storage HEAD request —
 * so this is a fast Postgres lookup rather than an S3 round-trip.
 *
 * - 'fresh'   → row exists, fetch succeeded, within TTL window
 * - 'stale'   → row exists but refreshed_at is older than TTL (re-fetch needed)
 * - 'missing' → no row, or last fetch failed
 */
export async function checkDomainAssetStatus(
  domain: string,
  assetType: 'favicon' | 'og_image',
  supabase: SupabaseClient<Database>,
): Promise<DomainAssetStatus> {
  const hash = await hashDomain(domain)

  const { data, error } = await supabase
    .from('domain_assets')
    .select('fetch_failed, favicon_refreshed_at, og_image_refreshed_at')
    .eq('domain_hash', hash)
    .maybeSingle()

  if (error || !data) return 'missing'
  if (data.fetch_failed) return 'missing'

  const refreshedAt =
    assetType === 'favicon' ? data.favicon_refreshed_at : data.og_image_refreshed_at

  if (!refreshedAt) return 'missing'

  const ttlDays =
    assetType === 'favicon' ? LIMITS.FAVICON_CACHE_TTL_DAYS : LIMITS.OG_IMAGE_CACHE_TTL_DAYS

  const ageMs = Date.now() - new Date(refreshedAt).getTime()
  const ttlMs = ttlDays * 24 * 60 * 60 * 1000

  return ageMs < ttlMs ? 'fresh' : 'stale'
}

/**
 * Get the cached public CDN URLs for a domain's assets.
 * Returns null for each URL if the asset hasn't been successfully cached yet.
 *
 * Used by bookmark rendering to pass faviconUrl / ogImageUrl to components.
 */
export async function getDomainAssetUrls(
  domain: string,
  supabase: SupabaseClient<Database>,
): Promise<{ favicon_url: string | null; og_image_url: string | null }> {
  const hash = await hashDomain(domain)

  const { data } = await supabase
    .from('domain_assets')
    .select('favicon_url, og_image_url, fetch_failed')
    .eq('domain_hash', hash)
    .maybeSingle()

  if (!data || data.fetch_failed) {
    return { favicon_url: null, og_image_url: null }
  }

  return {
    favicon_url: data.favicon_url ?? null,
    og_image_url: data.og_image_url ?? null,
  }
}

/**
 * Upsert a domain_assets row after a successful asset fetch.
 * MUST be called with a service-role Supabase client — regular user clients
 * cannot write to this table (no RLS INSERT policy for users).
 *
 * Called exclusively by M4's fetch-metadata edge function.
 */
export async function upsertDomainAsset(
  domain: string,
  assetType: 'favicon' | 'og_image',
  publicUrl: string,
  serviceRoleClient: SupabaseClient<Database>,
): Promise<void> {
  const hash = await hashDomain(domain)
  const now = new Date().toISOString()

  const updatePayload =
    assetType === 'favicon'
      ? { favicon_url: publicUrl, favicon_refreshed_at: now }
      : { og_image_url: publicUrl, og_image_refreshed_at: now }

  const { error } = await serviceRoleClient
    .from('domain_assets')
    .upsert(
      {
        domain_hash: hash,
        domain: normalizeDomain(domain),
        fetch_failed: false,
        fetch_attempted_at: now,
        orphaned_at: null,
        ...updatePayload,
      },
      { onConflict: 'domain_hash' },
    )

  if (error) {
    throw new Error(`Failed to upsert domain_assets for ${domain}: ${error.message}`)
  }
}

/**
 * Mark a domain fetch as failed so we don't repeatedly retry scraper-blocked domains.
 * MUST be called with a service-role client.
 */
export async function markDomainFetchFailed(
  domain: string,
  serviceRoleClient: SupabaseClient<Database>,
): Promise<void> {
  const hash = await hashDomain(domain)
  const now = new Date().toISOString()

  await serviceRoleClient.from('domain_assets').upsert(
    {
      domain_hash: hash,
      domain: normalizeDomain(domain),
      fetch_failed: true,
      fetch_attempted_at: now,
    },
    { onConflict: 'domain_hash' },
  )
}

/**
 * Build the public URL for a domain's favicon directly from the hash.
 * Use this when you have the hash already (avoids an async hashDomain call).
 */
export function getFaviconPublicUrl(
  domainHash: string,
  supabase: SupabaseClient<Database>,
): string {
  return getPublicUrl('favicons', faviconPath(domainHash), supabase)
}

/**
 * Build the public URL for a domain's OG image directly from the hash.
 */
export function getOgImagePublicUrl(
  domainHash: string,
  supabase: SupabaseClient<Database>,
): string {
  return getPublicUrl('og-images', ogImagePath(domainHash), supabase)
}

export type { DomainAsset, DomainAssetStatus }
