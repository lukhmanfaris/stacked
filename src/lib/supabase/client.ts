import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Singleton — all components share one instance and one lock queue.
// Multiple instances competing for the same localStorage key cause AbortErrors.
let _client: ReturnType<typeof createBrowserClient<Database>> | null = null

export const createClient = () => {
  if (!_client) {
    _client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
    )
  }
  return _client
}
