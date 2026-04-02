import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Service-role client — server-only. Never expose to the browser.
export const adminClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
