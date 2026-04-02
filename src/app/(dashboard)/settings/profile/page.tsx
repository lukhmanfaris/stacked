'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Metadata } from 'next'
import { useUser } from '@/contexts/user-context'
import { useProfile } from '@/hooks/use-profile'
import { profileSchema } from '@/lib/validators'
import { LIMITS } from '@/lib/constants'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { ProfileInput } from '@/lib/validators'

type FormValues = ProfileInput

function useUsernameCheck(value: string, currentUsername: string | undefined) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!value || value === currentUsername) {
      setStatus('idle')
      return
    }
    setStatus('checking')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      const res = await fetch(`/api/username/check?username=${encodeURIComponent(value)}`)
      const json = await res.json()
      if (json.data?.available) {
        setStatus('available')
        setSuggestions([])
      } else {
        setStatus('taken')
        setSuggestions(json.data?.suggestions ?? [])
      }
    }, LIMITS.USERNAME_CHECK_DEBOUNCE_MS)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [value, currentUsername])

  return { status, suggestions }
}

export default function ProfileSettingsPage() {
  const { profile, refetchProfile } = useUser()
  const { updateProfile, isUpdatingProfile } = useProfile()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: profile?.username ?? '',
      display_name: profile?.display_name ?? '',
      bio: profile?.bio ?? '',
    },
  })

  // Sync form when profile loads
  useEffect(() => {
    if (profile) {
      reset({
        username: profile.username ?? '',
        display_name: profile.display_name ?? '',
        bio: profile.bio ?? '',
      })
    }
  }, [profile, reset])

  const usernameValue = watch('username')
  const { status: usernameStatus, suggestions } = useUsernameCheck(
    usernameValue,
    profile?.username,
  )

  async function onSubmit(data: FormValues) {
    if (usernameStatus === 'taken') return
    try {
      await updateProfile(data)
      toast.success('Profile updated')
      reset(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile')
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/storage/avatar', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Upload failed')
      await refetchProfile()
      toast.success('Avatar updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload avatar')
    } finally {
      setIsUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleAvatarDelete() {
    setIsDeletingAvatar(true)
    try {
      const res = await fetch('/api/storage/avatar', { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Delete failed')
      await refetchProfile()
      toast.success('Avatar removed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove avatar')
    } finally {
      setIsDeletingAvatar(false)
    }
  }

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : profile?.username?.slice(0, 2).toUpperCase() ?? '?'

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-lg font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your public profile information.</p>
      </div>

      {/* Avatar */}
      <section className="flex items-center gap-4">
        <div className="relative">
          <Avatar size="lg" className="size-16">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {(isUploadingAvatar || isDeletingAvatar) && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <Loader2 className="size-4 animate-spin text-white" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar || isDeletingAvatar}
            >
              <Camera className="size-3.5" />
              Change
            </Button>
            {profile?.avatar_url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAvatarDelete}
                disabled={isUploadingAvatar || isDeletingAvatar}
                className="text-muted-foreground"
              >
                <Trash2 className="size-3.5" />
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">PNG, JPEG, or WebP · max 1 MB</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={handleAvatarUpload}
        />
      </section>

      {/* Profile form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {/* Username */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            {...register('username')}
            placeholder="your_username"
            aria-invalid={!!errors.username || usernameStatus === 'taken'}
          />
          {errors.username && (
            <p className="text-xs text-destructive">{errors.username.message}</p>
          )}
          {!errors.username && usernameStatus === 'checking' && (
            <p className="text-xs text-muted-foreground">Checking availability…</p>
          )}
          {!errors.username && usernameStatus === 'available' && (
            <p className="text-xs text-green-600 dark:text-green-400">Username is available</p>
          )}
          {!errors.username && usernameStatus === 'taken' && (
            <div className="flex flex-col gap-1">
              <p className="text-xs text-destructive">Username is already taken</p>
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {suggestions.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setValue('username', s, { shouldDirty: true })}
                      className="rounded bg-muted px-1.5 py-0.5 text-xs hover:bg-muted/80"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Display name */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="display_name">Display name</Label>
          <Input
            id="display_name"
            {...register('display_name')}
            placeholder="Your Name"
          />
          {errors.display_name && (
            <p className="text-xs text-destructive">{errors.display_name.message}</p>
          )}
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            {...register('bio')}
            placeholder="A short bio about yourself"
            rows={3}
            className="resize-none"
          />
          {errors.bio && (
            <p className="text-xs text-destructive">{errors.bio.message}</p>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!isDirty || usernameStatus === 'taken' || isUpdatingProfile}
          >
            {isUpdatingProfile && <Loader2 className="size-3.5 animate-spin" />}
            Save changes
          </Button>
        </div>
      </form>
    </div>
  )
}
