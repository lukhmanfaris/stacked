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
    const description = searchParams.get('error_description') ?? 'auth_error'
    const friendly = errorCode === 'otp_expired' ? 'link_expired' : 'auth_error'
    return NextResponse.redirect(`${origin}/login?error=${friendly}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[callback] code exchange error:', error.message)
    return NextResponse.redirect(`${origin}/login?error=auth_error`)
  }

  // Get user after session is established
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  // Note: last_login_at is updated automatically by the on_auth_user_signin DB trigger

  // Check onboarding status
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_step')
    .eq('id', user.id)
    .single()

  if (!profile || profile.onboarding_step !== 'done') {
    return NextResponse.redirect(`${origin}/onboarding`)
  }

  // Honour `next` param for post-login redirects (only allow relative paths)
  const redirectTo = next.startsWith('/') ? next : '/dashboard'
  return NextResponse.redirect(`${origin}${redirectTo}`)
}
