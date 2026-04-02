'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/contexts/user-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { STARTER_CATEGORIES, LIMITS } from '@/lib/constants'

// ── Step tracking ────────────────────────────────────────────
const STEPS = ['username', 'categories', 'first_bookmark'] as const
type Step = typeof STEPS[number]

function ProgressBar({ step }: { step: Step }) {
  const idx = STEPS.indexOf(step)
  return (
    <div className="flex items-center gap-1.5 justify-center mb-6">
      {STEPS.map((s, i) => (
        <div
          key={s}
          className={`h-1.5 w-8 rounded-full transition-colors ${
            i <= idx ? 'bg-primary' : 'bg-muted'
          }`}
        />
      ))}
    </div>
  )
}

// ── Step 1: Username ─────────────────────────────────────────
const usernameSchema = z.object({
  username: z
    .string()
    .min(3, 'At least 3 characters')
    .max(30, 'At most 30 characters')
    .regex(/^[a-z0-9_-]+$/, 'Lowercase letters, numbers, underscores, hyphens only'),
  display_name: z.string().max(50).optional(),
})
type UsernameInput = z.infer<typeof usernameSchema>

function StepUsername({
  onNext,
  defaultUsername,
}: {
  onNext: (data: UsernameInput) => Promise<void>
  defaultUsername: string
}) {
  const [availability, setAvailability] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<UsernameInput>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: defaultUsername },
  })

  const username = watch('username')

  // Debounced availability check
  useEffect(() => {
    if (!username || username.length < 3) { setAvailability('idle'); return }
    setAvailability('checking')
    const t = setTimeout(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle()
      if (error) { setAvailability('idle'); return }
      setAvailability(data ? 'taken' : 'available')
    }, LIMITS.USERNAME_CHECK_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [username, supabase])

  const onSubmit = async (data: UsernameInput) => {
    if (availability === 'taken') { toast.error('Username is taken'); return }
    setIsSubmitting(true)
    await onNext(data)
    setIsSubmitting(false)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stacked.app'
  const host = new URL(appUrl).host

  return (
    <>
      <CardHeader>
        <CardTitle>Choose your username</CardTitle>
        <CardDescription>This will be your public URL for sharing bookmarks.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="yourname"
              autoComplete="off"
              autoCapitalize="off"
              {...register('username')}
            />
            {username && username.length >= 3 && (
              <p className="text-xs text-muted-foreground">
                {host}/{username}
                {availability === 'checking' && ' · checking…'}
                {availability === 'available' && <span className="text-green-600"> · available</span>}
                {availability === 'taken' && <span className="text-destructive"> · taken</span>}
              </p>
            )}
            {errors.username && (
              <p className="text-xs text-destructive">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="display_name">
              Display name <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="display_name"
              placeholder="Your Name"
              {...register('display_name')}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || availability === 'taken' || availability === 'checking'}
          >
            {isSubmitting ? 'Saving…' : 'Continue'}
          </Button>
        </form>
      </CardContent>
    </>
  )
}

// ── Step 2: Starter Categories ───────────────────────────────
function StepCategories({
  onNext,
  onBack,
}: {
  onNext: (selected: string[]) => Promise<void>
  onBack: () => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggle = (name: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const onSubmit = async () => {
    if (selected.size === 0) { toast.error('Pick at least one category'); return }
    setIsSubmitting(true)
    await onNext(Array.from(selected))
    setIsSubmitting(false)
  }

  return (
    <>
      <CardHeader>
        <CardTitle>Pick your categories</CardTitle>
        <CardDescription>Choose topics you want to save links for. You can always add more later.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {STARTER_CATEGORIES.map(cat => {
            const isSelected = selected.has(cat.name)
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => toggle(cat.name)}
                className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-muted-foreground/50'
                }`}
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-xs font-medium leading-tight">{cat.name}</span>
              </button>
            )
          })}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onBack}>Back</Button>
          <Button
            className="flex-1"
            disabled={isSubmitting || selected.size === 0}
            onClick={onSubmit}
          >
            {isSubmitting ? 'Creating…' : `Continue (${selected.size})`}
          </Button>
        </div>
      </CardContent>
    </>
  )
}

// ── Step 3: First Bookmark ───────────────────────────────────
const urlSchema = z.object({
  url: z.string().url('Enter a valid URL'),
})
type UrlInput = z.infer<typeof urlSchema>

function StepFirstBookmark({
  onNext,
  onSkip,
  onBack,
}: {
  onNext: (url: string) => Promise<void>
  onSkip: () => Promise<void>
  onBack: () => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<UrlInput>({
    resolver: zodResolver(urlSchema),
  })

  const onSubmit = async (data: UrlInput) => {
    setIsSubmitting(true)
    await onNext(data.url)
    setIsSubmitting(false)
  }

  const handleSkip = async () => {
    setIsSkipping(true)
    await onSkip()
    setIsSkipping(false)
  }

  return (
    <>
      <CardHeader>
        <CardTitle>Add your first bookmark</CardTitle>
        <CardDescription>Paste any link to get started. We&apos;ll grab the title automatically.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              autoComplete="off"
              {...register('url')}
            />
            {errors.url && (
              <p className="text-xs text-destructive">{errors.url.message}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
              Back
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting || isSkipping}>
              {isSubmitting ? 'Saving…' : 'Save & get started'}
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-muted-foreground"
            disabled={isSubmitting || isSkipping}
            onClick={handleSkip}
          >
            {isSkipping ? 'Finishing…' : "I'll add bookmarks later →"}
          </Button>
        </form>
      </CardContent>
    </>
  )
}

// ── Main Onboarding page ─────────────────────────────────────
export default function OnboardingPage() {
  const { user, profile, isLoading, refetchProfile } = useUser()
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<Step>('username')

  // Resume from last saved step
  useEffect(() => {
    if (!isLoading && profile && profile.onboarding_step !== 'done') {
      const saved = profile.onboarding_step as Step
      if (STEPS.includes(saved)) setStep(saved)
    }
    if (!isLoading && profile?.onboarding_step === 'done') {
      router.replace('/dashboard')
    }
    if (!isLoading && !user) {
      router.replace('/login')
    }
  }, [isLoading, profile, router, user])

  const persistStep = useCallback(async (nextStep: Step | 'done') => {
    if (!user) return
    await supabase.from('profiles').update({ onboarding_step: nextStep }).eq('id', user.id)
    await refetchProfile()
  }, [user, supabase, refetchProfile])

  const handleUsername = async ({ username, display_name }: { username: string; display_name?: string }) => {
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .update({ username, display_name: display_name || null, onboarding_step: 'categories' })
      .eq('id', user.id)
    if (error) { toast.error(error.message); return }
    await refetchProfile()
    setStep('categories')
  }

  const handleCategories = async (selected: string[]) => {
    if (!user) return
    const rows = selected.map((name, i) => {
      const cat = STARTER_CATEGORIES.find(c => c.name === name)!
      return {
        user_id: user.id,
        name: cat.name,
        slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
        color: cat.color,
        icon: cat.icon,
        sort_order: i,
        is_default: i === 0,
      }
    })
    const { error } = await supabase.from('categories').insert(rows)
    if (error) { toast.error(error.message); return }
    await persistStep('first_bookmark')
    setStep('first_bookmark')
  }

  const handleFirstBookmark = async (_url: string) => {
    // Bookmark insert stubbed until M3 (bookmarks table not yet created)
    await completeOnboarding()
  }

  const completeOnboarding = async () => {
    await persistStep('done')
    router.replace('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    )
  }

  const defaultUsername = profile?.username ?? ''

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Stacked</h1>
          <p className="text-sm text-muted-foreground mt-1">Let&apos;s set up your account</p>
        </div>
        <ProgressBar step={step} />
        <Card>
          {step === 'username' && (
            <StepUsername onNext={handleUsername} defaultUsername={defaultUsername} />
          )}
          {step === 'categories' && (
            <StepCategories
              onNext={handleCategories}
              onBack={() => setStep('username')}
            />
          )}
          {step === 'first_bookmark' && (
            <StepFirstBookmark
              onNext={handleFirstBookmark}
              onSkip={completeOnboarding}
              onBack={() => setStep('categories')}
            />
          )}
        </Card>
      </div>
    </div>
  )
}
