import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Supabase forwards auth errors as query params (e.g. expired OTP)
  const errorCode = searchParams.get('error_code')
  if (errorCode) {
    const friendly = errorCode === 'otp_expired' ? 'link_expired' : 'auth_error'
    return NextResponse.redirect(`${origin}/login?error=${friendly}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()

  // exchangeCodeForSession returns the session directly — no need to call
  // getUser() separately. A second getUser() call writes updated tokens to
  // cookies again, which triggers a lock race when the browser client
  // initializes from those same cookies immediately after the redirect.
  const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !session) {
    console.error('[callback] code exchange error:', error?.message)
    return NextResponse.redirect(`${origin}/login?error=auth_error`)
  }

  const user = session.user

  // Check onboarding status
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_step')
    .eq('id', user.id)
    .single()

  if (!profile || profile.onboarding_step !== 'done') {
    return NextResponse.redirect(`${origin}/onboarding`)
  }

  // Honour `next` param — only allow relative paths
  const redirectTo = next.startsWith('/') ? next : '/dashboard'
  return NextResponse.redirect(`${origin}${redirectTo}`)
}
