'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  agreed: z.boolean().refine(v => v === true, 'You must accept the terms'),
})
type SignupInput = z.infer<typeof signupSchema>

type SignupState = 'idle' | 'loading-email' | 'loading-google' | 'loading-github'

export default function SignupPage() {
  const [state, setState] = useState<SignupState>('idle')
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors } } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { agreed: false },
  })

  const onEmailSignup = async (data: SignupInput) => {
    setState('loading-email')
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: crypto.randomUUID(), // magic-link only — password is never used
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        toast.error('An account with this email already exists. Try signing in.')
      } else if (error.message.toLowerCase().includes('rate limit') || error.status === 429) {
        toast.error('Too many emails sent. Please wait a few minutes before trying again.')
      } else {
        toast.error(error.message)
      }
      setState('idle')
      return
    }
    router.push(`/verify-email?email=${encodeURIComponent(data.email)}`)
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
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Start organizing your bookmarks for free.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
            Sign up with Google
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
            Sign up with GitHub
          </Button>
        </div>

        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            or
          </span>
        </div>

        <form onSubmit={handleSubmit(onEmailSignup)} className="space-y-3">
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

          <div className="flex items-start gap-2">
            <input
              id="agreed"
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
              disabled={isLoading}
              {...register('agreed')}
            />
            <Label htmlFor="agreed" className="text-xs font-normal leading-tight cursor-pointer">
              I agree to the{' '}
              <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>
            </Label>
          </div>
          {errors.agreed && (
            <p className="text-xs text-destructive">{errors.agreed.message}</p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {state === 'loading-email' && (
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" />
            )}
            Create account
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="underline hover:text-foreground">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
