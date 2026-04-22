'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { LegalModal } from '@/components/shared/legal-modal'

const signupSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  agreed: z.boolean().refine(v => v === true, 'Must accept terms to continue'),
  marketingConsent: z.boolean().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
type SignupInput = z.infer<typeof signupSchema>

type SignupState = 'idle' | 'loading-email' | 'loading-google' | 'loading-github'

export default function SignupPage() {
  const [state, setState] = useState<SignupState>('idle')
  const [termsOpen, setTermsOpen] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const router = useRouter()

  const { register, handleSubmit, formState: { errors } } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { agreed: false, marketingConsent: false },
  })

  const onEmailSignup = async (data: SignupInput) => {
    setState('loading-email')
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        const isRateLimit    = error.message.toLowerCase().includes('rate limit') || error.status === 429
        const isNetworkError = error.message === 'Failed to fetch' || error.message === 'Load failed' || error.status === 0
        if (error.message.toLowerCase().includes('already registered')) toast.error('Account exists. Try signing in.')
        else if (isRateLimit)    toast.error('Too many requests. Wait a few minutes.')
        else if (isNetworkError) toast.error('Unable to connect. Check your internet connection.')
        else                     toast.error(error.message)
        setState('idle')
        return
      }
      // Store marketing consent on profile (created by DB trigger on auth.users insert)
      if (authData.user && (data.marketingConsent ?? false)) {
        await supabase.from('profiles')
          .update({ marketing_consent: true })
          .eq('id', authData.user.id)
      }

      // Session present → email confirmation disabled, proceed immediately
      if (authData.session) {
        router.push('/onboarding')
      } else {
        // Email confirmation required — soft gate, user can confirm later
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`)
      }
    } catch {
      toast.error('Unable to connect. Check your internet connection.')
      setState('idle')
    }
  }

  const onOAuth = async (provider: 'google' | 'github') => {
    setState(provider === 'google' ? 'loading-google' : 'loading-github')
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      toast.error(error.message)
      setState('idle')
    }
  }

  const isLoading = state !== 'idle'

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div>
        <h2 className="font-sans text-base font-medium text-[var(--nd-text-display)] tracking-[-0.01em]">
          Create account
        </h2>
        <p className="mt-1 font-sans text-sm text-[var(--nd-text-secondary)]">
          Start organizing bookmarks for free.
        </p>
      </div>

      {/* OAuth */}
      <div className="flex flex-col gap-2">
        <Button
          variant="secondary"
          className="w-full"
          disabled={isLoading}
          onClick={() => onOAuth('google')}
        >
          {state === 'loading-google' ? (
            <span className="size-3.5 rounded-full border border-current border-t-transparent animate-spin" />
          ) : (
            <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          Google
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          disabled={isLoading}
          onClick={() => onOAuth('github')}
        >
          {state === 'loading-github' ? (
            <span className="size-3.5 rounded-full border border-current border-t-transparent animate-spin" />
          ) : (
            <svg className="size-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          )}
          GitHub
        </Button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--nd-border)]" />
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--nd-text-disabled)]">or</span>
        <div className="h-px flex-1 bg-[var(--nd-border)]" />
      </div>

      {/* Email form */}
      <form onSubmit={handleSubmit(onEmailSignup)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="email"
            className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--nd-text-secondary)]"
          >
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isLoading}
            {...register('email')}
          />
          {errors.email && (
            <p className="font-mono text-[11px] text-[var(--nd-accent)]">{errors.email.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="password"
            className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--nd-text-secondary)]"
          >
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            disabled={isLoading}
            {...register('password')}
          />
          {errors.password && (
            <p className="font-mono text-[11px] text-[var(--nd-accent)]">{errors.password.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="confirmPassword"
            className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--nd-text-secondary)]"
          >
            Confirm password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Repeat password"
            autoComplete="new-password"
            disabled={isLoading}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="font-mono text-[11px] text-[var(--nd-accent)]">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-start gap-2.5">
            <input
              id="agreed"
              type="checkbox"
              className="mt-0.5 size-3.5 shrink-0 rounded-none border-[var(--nd-border-visible)] accent-[var(--nd-text-display)]"
              disabled={isLoading}
              {...register('agreed')}
            />
            <label
              htmlFor="agreed"
              className="cursor-pointer font-sans text-xs leading-relaxed text-[var(--nd-text-secondary)]"
            >
              I agree to the{' '}
              <button
                type="button"
                onClick={() => setTermsOpen(true)}
                className="text-[var(--nd-text-primary)] underline underline-offset-2 hover:text-[var(--nd-text-display)]"
              >
                Terms of Service
              </button>
              {' '}and{' '}
              <button
                type="button"
                onClick={() => setPrivacyOpen(true)}
                className="text-[var(--nd-text-primary)] underline underline-offset-2 hover:text-[var(--nd-text-display)]"
              >
                Privacy Policy
              </button>
            </label>
          </div>
          {errors.agreed && (
            <p className="font-mono text-[11px] text-[var(--nd-accent)]">{errors.agreed.message}</p>
          )}

          <div className="flex items-start gap-2.5">
            <input
              id="marketingConsent"
              type="checkbox"
              className="mt-0.5 size-3.5 shrink-0 rounded-none border-[var(--nd-border-visible)] accent-[var(--nd-text-display)]"
              disabled={isLoading}
              {...register('marketingConsent')}
            />
            <label
              htmlFor="marketingConsent"
              className="cursor-pointer font-sans text-xs leading-relaxed text-[var(--nd-text-secondary)]"
            >
              I&apos;d like to receive product updates and announcements from Stacked{' '}
              <span className="text-[var(--nd-text-disabled)]">(optional)</span>
            </label>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {state === 'loading-email' && (
            <span className="size-3.5 rounded-full border border-current border-t-transparent animate-spin" />
          )}
          Create account
        </Button>
      </form>

      {/* Sign-in link */}
      <p className="text-center font-sans text-xs text-[var(--nd-text-secondary)]">
        Have an account?{' '}
        <Link
          href="/login"
          className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--nd-text-primary)] hover:text-[var(--nd-text-display)] transition-colors"
        >
          Sign in
        </Link>
      </p>

      <LegalModal type="terms" open={termsOpen} onClose={() => setTermsOpen(false)} />
      <LegalModal type="privacy" open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </div>
  )
}
