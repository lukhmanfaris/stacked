'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useUser } from '@/contexts/user-context'
import { useProfile } from '@/hooks/use-profile'
import { useCategories } from '@/hooks/use-categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { UserPreferences } from '@/types/profile'

// ─── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-input',
      )}
    >
      <span
        className={cn(
          'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0',
        )}
      />
    </button>
  )
}

// ─── Pref row ──────────────────────────────────────────────────────────────────

function PrefRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </div>
      {children}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PreferencesPage() {
  const router = useRouter()
  const { profile } = useUser()
  const { updatePreferences, isUpdatingPreferences, deleteAccount, isDeletingAccount } =
    useProfile()
  const { flatCategories } = useCategories()

  const prefs = profile?.preferences
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [showDeleteZone, setShowDeleteZone] = useState(false)

  async function handlePrefChange(patch: Partial<UserPreferences>) {
    try {
      await updatePreferences(patch)
      toast.success('Preferences saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save preferences')
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== profile?.username) return
    try {
      await deleteAccount()
      router.replace('/login')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete account')
    }
  }

  if (!prefs) return null

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-lg font-semibold">Preferences</h1>
        <p className="text-sm text-muted-foreground">Customize how Stacked looks and behaves.</p>
      </div>

      {/* Appearance */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Appearance
        </h2>

        <PrefRow label="Theme" description="Choose your preferred color scheme">
          <Select
            value={prefs.theme}
            onValueChange={(v) => handlePrefChange({ theme: v as UserPreferences['theme'] })}
            disabled={isUpdatingPreferences}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </PrefRow>

        <PrefRow label="Compact mode" description="Reduce padding for a denser layout">
          <Toggle
            checked={prefs.compact_mode}
            onChange={(v) => handlePrefChange({ compact_mode: v })}
            disabled={isUpdatingPreferences}
          />
        </PrefRow>

        <PrefRow label="Show favicons" description="Display site icons next to bookmarks">
          <Toggle
            checked={prefs.show_favicons}
            onChange={(v) => handlePrefChange({ show_favicons: v })}
            disabled={isUpdatingPreferences}
          />
        </PrefRow>

        <PrefRow
          label="Show Open Graph images"
          description="Display preview images when available"
        >
          <Toggle
            checked={prefs.show_og_images}
            onChange={(v) => handlePrefChange({ show_og_images: v })}
            disabled={isUpdatingPreferences}
          />
        </PrefRow>
      </section>

      <Separator />

      {/* Defaults */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Defaults
        </h2>

        <PrefRow label="Default view" description="How bookmarks are displayed by default">
          <Select
            value={prefs.default_view}
            onValueChange={(v) =>
              handlePrefChange({ default_view: v as UserPreferences['default_view'] })
            }
            disabled={isUpdatingPreferences}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stack">Stack</SelectItem>
              <SelectItem value="grid">Grid</SelectItem>
              <SelectItem value="list">List</SelectItem>
            </SelectContent>
          </Select>
        </PrefRow>

        <PrefRow label="Default category" description="Category opened on first load">
          <Select
            value={prefs.default_category_id ?? 'none'}
            onValueChange={(v) =>
              handlePrefChange({ default_category_id: v === 'none' ? null : v })
            }
            disabled={isUpdatingPreferences}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">All Bookmarks</SelectItem>
              {flatCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PrefRow>

        <PrefRow label="Items per page" description="Number of bookmarks loaded at once">
          <Select
            value={String(prefs.items_per_page)}
            onValueChange={(v) => handlePrefChange({ items_per_page: Number(v) })}
            disabled={isUpdatingPreferences}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="40">40</SelectItem>
              <SelectItem value="60">60</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </PrefRow>
      </section>

      <Separator />

      {/* Notifications */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Notifications
        </h2>

        <PrefRow
          label="Email notifications"
          description="Receive product updates and tips via email"
        >
          <Toggle
            checked={prefs.email_notifications}
            onChange={(v) => handlePrefChange({ email_notifications: v })}
            disabled={isUpdatingPreferences}
          />
        </PrefRow>
      </section>

      <Separator />

      {/* Danger zone */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-destructive uppercase tracking-wide">
          Danger Zone
        </h2>

        {!showDeleteZone ? (
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div>
              <p className="text-sm font-medium">Delete account</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete your account and all data. This cannot be undone.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setShowDeleteZone(true)}
            >
              Delete account
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
            <p className="text-sm text-destructive font-medium">
              This will permanently delete your account, all bookmarks, and categories. There is no
              undo.
            </p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="delete-confirm" className="text-sm">
                Type{' '}
                <span className="font-mono font-semibold">{profile?.username}</span>{' '}
                to confirm
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={profile?.username ?? ''}
                className="border-destructive/50 focus-visible:border-destructive focus-visible:ring-destructive/20"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowDeleteZone(false)
                  setDeleteConfirm('')
                }}
                disabled={isDeletingAccount}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== profile?.username || isDeletingAccount}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeletingAccount && <Loader2 className="size-3.5 animate-spin" />}
                Delete my account
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
