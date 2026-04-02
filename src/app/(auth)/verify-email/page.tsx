'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LIMITS } from '@/lib/constants'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const router = useRouter()
  const supabase = createClient()

  const [cooldown, setCooldown] = useState(0)
  const [isSending, setIsSending] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Listen for email confirmation via Supabase Auth state change
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.replace('/onboarding')
      }
    })
    return () => subscription.unsubscribe()
  }, [router, supabase])

  const startCooldown = () => {
    setCooldown(LIMITS.VERIFY_EMAIL_RESEND_COOLDOWN_S)
    timerRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleResend = async () => {
    if (cooldown > 0 || !email) return
    setIsSending(true)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setIsSending(false)
    if (error) {
      const isRateLimit = error.message.toLowerCase().includes('rate limit') ||
        error.status === 429
      toast.error(isRateLimit
        ? 'Too many emails sent. Please wait a few minutes before trying again.'
        : error.message
      )
      return
    }
    toast.success('Verification email sent!')
    startCooldown()
  }

  // Mask email: j***@example.com
  const maskedEmail = email
    ? email.replace(/^(.{1,2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.max(b.length, 3)) + c)
    : ''

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 text-4xl">✉️</div>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          We sent a verification link to <strong>{maskedEmail || 'your email'}</strong>.
          <br />
          Check your inbox and click the link to continue.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          className="w-full"
          variant="outline"
          disabled={cooldown > 0 || isSending || !email}
          onClick={handleResend}
        >
          {isSending
            ? 'Sending...'
            : cooldown > 0
            ? `Resend in ${cooldown}s`
            : 'Resend verification email'}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Wrong email?{' '}
          <Link href="/signup" className="underline hover:text-foreground">
            Go back to sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
