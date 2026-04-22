'use client'

import { useState, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LIMITS } from '@/lib/constants'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''

  const [cooldown, setCooldown] = useState(0)
  const [isSending, setIsSending] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
      const isRateLimit = error.message.toLowerCase().includes('rate limit') || error.status === 429
      toast.error(isRateLimit ? 'Too many requests. Wait a few minutes.' : error.message)
      return
    }
    toast.success('Verification email sent.')
    startCooldown()
  }

  const maskedEmail = email
    ? email.replace(/^(.{1,2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.max(b.length, 3)) + c)
    : ''

  return (
    <div className="flex flex-col gap-6">
      {/* Status */}
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--nd-text-disabled)] mb-1">
          Status
        </p>
        <p className="font-mono text-sm text-[var(--nd-text-display)]">
          [ Verify your email ]
        </p>
      </div>

      {/* Message */}
      <p className="font-sans text-sm text-[var(--nd-text-secondary)] leading-relaxed">
        Verification link sent to{' '}
        <strong className="font-medium text-[var(--nd-text-primary)]">{maskedEmail || 'your email'}</strong>.
        Your account is active — confirm when ready.
      </p>

      {/* Resend */}
      <Button
        variant="secondary"
        className="w-full"
        disabled={cooldown > 0 || isSending || !email}
        onClick={handleResend}
      >
        {isSending ? (
          <span className="size-3.5 rounded-full border border-current border-t-transparent animate-spin" />
        ) : null}
        {isSending
          ? 'Sending'
          : cooldown > 0
          ? `Resend in ${cooldown}s`
          : 'Resend link'}
      </Button>

      {/* Continue to app */}
      <Link
        href="/dashboard"
        className="block text-center font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--nd-text-primary)] hover:text-[var(--nd-text-display)] transition-colors"
      >
        Continue to app →
      </Link>

      <p className="text-center font-sans text-xs text-[var(--nd-text-secondary)]">
        Wrong email?{' '}
        <Link
          href="/signup"
          className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--nd-text-primary)] hover:text-[var(--nd-text-display)] transition-colors"
        >
          Go back
        </Link>
      </p>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
