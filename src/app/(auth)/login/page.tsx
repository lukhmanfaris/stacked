'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})
type LoginInput = z.infer<typeof loginSchema>

type LoginState = 'idle' | 'loading-email' | 'loading-google' | 'loading-github' | 'email-sent'

const ERROR_MESSAGES: Record<string, string> = {
  link_expired: 'Your sign-in link has expired. Please request a new one.',
  auth_error: 'Sign-in failed. Please try again.',
  missing_code: 'Invalid sign-in link. Please request a new one.',
}

export default function LoginPage() {
  const [state, setState] = useState<LoginState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const supabase = createClient()

  // Read error param set by /auth/callback on failure
  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get('error')
    if (err && ERROR_MESSAGES[err]) setErrorMsg(ERROR_MESSAGES[err])
  }, [])

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onMagicLink = async (data: LoginInput) => {
    setState('loading-email')
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      const isRateLimit = error.message.toLowerCase().includes('rate limit') ||
        error.status === 429
      toast.error(isRateLimit
        ? 'Too many emails sent. Please wait a few minutes before trying again.'
        : error.message
      )
      setState('idle')
      return
    }
    setState('email-sent')
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

  if (state === 'email-sent') {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 text-4xl">📬</div>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We sent a magic link to <strong>{getValues('email')}</strong>.<br />
            Click it to sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-center text-muted-foreground">
            Didn&apos;t receive it?{' '}
            <button
              className="underline hover:text-foreground"
              onClick={() => setState('idle')}
            >
              Try again
            </button>
          </p>
        </CardContent>
      </Card>
    )
  }

  const isLoading = state !== 'idle'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Welcome back — pick your sign-in method.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMsg && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMsg}
          </p>
        )}
        {/* OAuth */}
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            disabled={isLoading}
            onClick={() => onOAuth('google')}
          >
            {state === 'loading-google' ? (
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Continue with Google
          </Button>
          <Button
            variant="outline"
            className="w-full"
            disabled={isLoading}
            onClick={() => onOAuth('github')}
          >
            {state === 'loading-github' ? (
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" />
            ) : (
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            )}
            Continue with GitHub
          </Button>
        </div>

        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            or
          </span>
        </div>

        {/* Magic Link */}
        <form onSubmit={handleSubmit(onMagicLink)} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={isLoading}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {state === 'loading-email' && (
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" />
            )}
            Send magic link
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="underline hover:text-foreground">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
