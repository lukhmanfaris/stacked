'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { useUser } from '@/contexts/user-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { STARTER_CATEGORIES, LIMITS } from '@/lib/constants'

// ── Step tracking ────────────────────────────────────────────
const STEPS = ['username', 'categories', 'first_bookmark'] as const
type Step = typeof STEPS[number]

function ProgressBar({ step }: { step: Step }) {
  const idx = STEPS.indexOf(step)
  return (
    <div className="flex items-center gap-1.5 justify-center mb-8">
      {STEPS.map((s, i) => (
        <div
          key={s}
          className={`h-[3px] w-8 rounded-full transition-colors ${
            i <= idx ? 'bg-[var(--nd-text-display)]' : 'bg-[var(--nd-border)]'
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

  const { register, handleSubmit, watch, formState: { errors } } = useForm<UsernameInput>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: defaultUsername },
  })

  const username = watch('username')

  // Debounced availability check
  useEffect(() => {
    if (!username || username.length < 3 || !/^[a-z0-9_-]+$/.test(username)) {
      setAvailability('idle')
      return
    }
    // Skip check if username matches current profile username
    if (username === defaultUsername) {
      setAvailability('available')
      return
    }
    setAvailability('checking')
    const t = setTimeout(async () => {
      const { data, error } = await (supabase as any)
        .rpc('is_username_available', { p_username: username })
      if (error) { setAvailability('idle'); return }
      setAvailability(data ? 'available' : 'taken')
    }, LIMITS.USERNAME_CHECK_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [username, defaultUsername])

  const onSubmit = async (data: UsernameInput) => {
    if (availability === 'taken') { toast.error('Username is taken'); return }
    setIsSubmitting(true)
    await onNext(data)
    setIsSubmitting(false)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stacked.app'
  const host = new URL(appUrl).host

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-sans text-base font-medium text-[var(--nd-text-display)] tracking-[-0.01em]">
          Choose your username
        </h2>
        <p className="mt-1 font-sans text-sm text-[var(--nd-text-secondary)]">
          This will be your public URL for sharing bookmarks.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="username"
            className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--nd-text-secondary)]"
          >
            Username
          </Label>
          <Input
            id="username"
            placeholder="yourname"
            autoComplete="off"
            autoCapitalize="off"
            {...register('username')}
          />
          {username && username.length >= 3 && (
            <p className="font-mono text-[11px] text-[var(--nd-text-disabled)]">
              {host}/{username}
              {availability === 'checking' && ' · checking…'}
              {availability === 'available' && (
                <span className="text-[var(--nd-text-primary)]"> · available</span>
              )}
              {availability === 'taken' && (
                <span className="text-[var(--nd-accent)]"> · taken</span>
              )}
            </p>
          )}
          {errors.username && (
            <p className="font-mono text-[11px] text-[var(--nd-accent)]">{errors.username.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="display_name"
            className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--nd-text-secondary)]"
          >
            Display name{' '}
            <span className="text-[var(--nd-text-disabled)] normal-case tracking-normal font-sans">(optional)</span>
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
          {isSubmitting ? (
            <span className="size-3.5 rounded-full border border-current border-t-transparent animate-spin" />
          ) : null}
          {isSubmitting ? 'Saving' : 'Continue'}
        </Button>
      </form>
    </div>
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
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-sans text-base font-medium text-[var(--nd-text-display)] tracking-[-0.01em]">
          Pick your categories
        </h2>
        <p className="mt-1 font-sans text-sm text-[var(--nd-text-secondary)]">
          Choose topics you want to save links for. Add more anytime.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {STARTER_CATEGORIES.map(cat => {
          const isSelected = selected.has(cat.name)
          return (
            <button
              key={cat.name}
              type="button"
              onClick={() => toggle(cat.name)}
              className={`flex items-center justify-center rounded-[8px] border p-3 text-center transition-all ${
                isSelected
                  ? 'border-[var(--nd-text-display)] bg-[var(--nd-surface-active)]'
                  : 'border-[var(--nd-border)] hover:border-[var(--nd-border-visible)]'
              }`}
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--nd-text-primary)] leading-tight">
                {cat.name}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button
          className="flex-1"
          disabled={isSubmitting || selected.size === 0}
          onClick={onSubmit}
        >
          {isSubmitting ? (
            <span className="size-3.5 rounded-full border border-current border-t-transparent animate-spin" />
          ) : null}
          {isSubmitting ? 'Creating' : `Continue (${selected.size})`}
        </Button>
      </div>
    </div>
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

  const isBusy = isSubmitting || isSkipping

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-sans text-base font-medium text-[var(--nd-text-display)] tracking-[-0.01em]">
          Add your first bookmark
        </h2>
        <p className="mt-1 font-sans text-sm text-[var(--nd-text-secondary)]">
          Paste any link to get started. We'll grab the title automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="url"
            className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--nd-text-secondary)]"
          >
            URL
          </Label>
          <Input
            id="url"
            type="url"
            placeholder="https://example.com"
            autoComplete="off"
            {...register('url')}
          />
          {errors.url && (
            <p className="font-mono text-[11px] text-[var(--nd-accent)]">{errors.url.message}</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onBack} disabled={isBusy}>
            Back
          </Button>
          <Button type="submit" className="flex-1" disabled={isBusy}>
            {isSubmitting ? (
              <span className="size-3.5 rounded-full border border-current border-t-transparent animate-spin" />
            ) : null}
            {isSubmitting ? 'Saving' : 'Save & start'}
          </Button>
        </div>

        <button
          type="button"
          className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--nd-text-disabled)] hover:text-[var(--nd-text-secondary)] transition-colors text-center"
          disabled={isBusy}
          onClick={handleSkip}
        >
          {isSkipping ? 'Finishing…' : "I'll add bookmarks later →"}
        </button>
      </form>
    </div>
  )
}

// ── Main Onboarding page ─────────────────────────────────────
export default function OnboardingPage() {
  const { user, profile, isLoading, refetchProfile } = useUser()
  const router = useRouter()
  const [step, setStep] = useState<Step>('username')

  // Resume from last saved step
  useEffect(() => {
    if (isLoading) return
    if (!user) { router.replace('/login'); return }
    if (profile?.onboarding_step === 'done') { router.replace('/dashboard'); return }
    if (profile && profile.onboarding_step !== 'done') {
      const saved = profile.onboarding_step as Step
      if (STEPS.includes(saved)) setStep(saved)
    }
  }, [isLoading, profile, router, user])

  const persistStep = useCallback(async (nextStep: Step | 'done') => {
    if (!user) return
    await (supabase as any).from('profiles').update({ onboarding_step: nextStep }).eq('id', user.id)
    await refetchProfile()
  }, [user, refetchProfile])

  const handleUsername = async ({ username, display_name }: { username: string; display_name?: string }) => {
    if (!user) return
    const { error } = await (supabase as any)
      .from('profiles')
      .update({ username, display_name: display_name || null, onboarding_step: 'categories' })
      .eq('id', user.id)
    if (error) {
      if (error.code === '23505') toast.error('Username is already taken.')
      else toast.error(error.message)
      return
    }
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
    const { error } = await (supabase as any).from('categories').insert(rows)
    if (error) { toast.error(error.message); return }
    await persistStep('first_bookmark')
    setStep('first_bookmark')
  }

  const handleFirstBookmark = async (url: string) => {
    if (!user) return
    // Get default category for this user
    const { data: defaultCat } = await (supabase as any)
      .from('categories')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single()

    if (defaultCat) {
      const parsed = new URL(url)
      const domain = parsed.hostname.toLowerCase().replace(/^www\./, '')
      const { error } = await (supabase as any).from('bookmarks').insert({
        user_id: user.id,
        url,
        title: domain,
        domain,
        tags: [],
        category_id: defaultCat.id,
      })
      if (error) { toast.error(error.message); return }
    }
    await completeOnboarding()
  }

  const completeOnboarding = async () => {
    await persistStep('done')
    router.replace('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--nd-bg)]">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--nd-text-disabled)]">
          [ Loading ]
        </p>
      </div>
    )
  }

  const defaultUsername = profile?.username ?? ''

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[var(--nd-bg)] px-4 dot-grid">
      {/* Wordmark */}
      <div className="mb-12 text-center">
        <h1 className="font-mono text-[13px] uppercase tracking-[0.24em] text-[var(--nd-text-display)]">
          Stacked
        </h1>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--nd-text-disabled)]">
          Let's set up your account
        </p>
      </div>

      <div className="w-full max-w-sm">
        <ProgressBar step={step} />
        <div className="rounded-[12px] border border-[var(--nd-border-visible)] bg-[var(--nd-surface)] p-8">
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
        </div>
      </div>

      {/* Bottom mark */}
      <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--nd-text-disabled)]">
        © Stacked
      </p>
    </div>
  )
}
