import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { StorageBucket, UploadResult } from './types'

// ─── Path helpers ────────────────────────────────────────────────────────────

/** Storage path for a domain's favicon. domainHash = output of hashDomain(). */
export function faviconPath(domainHash: string): string {
  return `${domainHash}.png`
}

/** Storage path for a domain's OG image. domainHash = output of hashDomain(). */
export function ogImagePath(domainHash: string): string {
  return `${domainHash}.webp`
}

/** Storage path for a user's avatar. */
export function avatarPath(userId: string): string {
  return `${userId}/avatar.webp`
}

// ─── Core utilities ──────────────────────────────────────────────────────────

/**
 * Synchronously construct the public CDN URL for a storage object.
 * No network call — pure string construction.
 */
export function getPublicUrl(
  bucket: StorageBucket,
  path: string,
  supabase: SupabaseClient<Database>,
): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Upload a file to a storage bucket. Uses upsert so re-uploading
 * a refreshed asset overwrites the existing object cleanly.
 *
 * For favicons/og-images: call from a service-role client (edge function).
 * For avatars: call from a user-session server client (RLS enforced).
 */
export async function uploadFile(
  bucket: StorageBucket,
  path: string,
  file: File | Blob | ArrayBuffer,
  contentType: string,
  supabase: SupabaseClient<Database>,
): Promise<UploadResult> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: true,
      cacheControl: bucket === 'avatars' ? '3600' : '86400',
    })

  if (error) {
    throw new Error(`Storage upload failed [${bucket}/${path}]: ${error.message}`)
  }

  const publicUrl = getPublicUrl(bucket, path, supabase)
  return { path, publicUrl }
}

/**
 * Delete a file from a storage bucket.
 * No-op if the file does not exist (Supabase returns no error for missing objects).
 *
 * For favicons/og-images: service-role client only.
 * For avatars: user-session client (RLS enforced).
 */
export async function deleteFile(
  bucket: StorageBucket,
  path: string,
  supabase: SupabaseClient<Database>,
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) {
    throw new Error(`Storage delete failed [${bucket}/${path}]: ${error.message}`)
  }
}
