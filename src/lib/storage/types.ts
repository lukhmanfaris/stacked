export type StorageBucket = 'favicons' | 'og-images' | 'avatars'

export type DomainAssetStatus = 'fresh' | 'stale' | 'missing'

export interface UploadResult {
  path: string
  publicUrl: string
}

export interface DomainAsset {
  domain_hash: string
  domain: string
  favicon_url: string | null
  og_image_url: string | null
  favicon_refreshed_at: string | null
  og_image_refreshed_at: string | null
  fetch_attempted_at: string
  fetch_failed: boolean
  orphaned_at: string | null
  created_at: string
  updated_at: string
}
