import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, handleApiError } from '@/lib/api-response'
import { RateLimitError, ValidationError } from '@/lib/errors'
import { APP_CONFIG } from '@/lib/constants'

// In-memory rate limit: email → last resend timestamp
// NOTE: Resets on cold start in serverless deployments — best-effort for MVP.
// For production hardening, migrate to Supabase-backed or Upstash Redis rate limiting.
const resendTimestamps = new Map<string, number>()
const COOLDOWN_MS = 60 * 1000

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Also support unauthenticated resend (user not yet logged in)
    let email: string | undefined = user?.email

    if (!email) {
      const body = await request.json().catch(() => ({}))
      email = body.email
    }

    if (!email) {
      throw new ValidationError([{ field: 'email', message: 'Email is required' }])
    }

    const rateKey = email
    const lastSent = resendTimestamps.get(rateKey) ?? 0
    if (Date.now() - lastSent < COOLDOWN_MS) {
      throw new RateLimitError(`Please wait ${Math.ceil((COOLDOWN_MS - (Date.now() - lastSent)) / 1000)}s before resending.`)
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${APP_CONFIG.url}/auth/callback`,
      },
    })

    if (error) throw new Error(error.message)

    resendTimestamps.set(rateKey, Date.now())
    return apiSuccess({ message: 'Verification email sent' })
  } catch (err) {
    return handleApiError(err)
  }
}
