'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { categorySchema } from '@/lib/validators'
import { generateSlug } from '@/lib/utils'
import { CATEGORY_COLORS } from '@/lib/constants'
import type { CategoryFormData, Category } from '@/types/category'

// Common Lucide icon names for the selector
const ICONS = [
  'folder', 'bookmark', 'star', 'heart', 'tag', 'archive',
  'briefcase', 'camera', 'code', 'coffee', 'film', 'globe',
  'home', 'layers', 'map-pin', 'music', 'newspaper', 'palette',
  'shopping-cart', 'tool', 'trending-up', 'tv', 'zap',
]

interface CategoryFormProps {
  onSubmit: (data: CategoryFormData) => Promise<void>
  defaultValues?: Partial<CategoryFormData>
  parentOptions?: Pick<Category, 'id' | 'name'>[]
  isLoading?: boolean
}

export function CategoryForm({
  onSubmit,
  defaultValues,
  parentOptions = [],
  isLoading,
}: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      color: CATEGORY_COLORS[0],
      icon: 'folder',
      parent_id: null,
      ...defaultValues,
    },
  })

  const name = watch('name')
  const color = watch('color')
  const icon = watch('icon')
  const parent_id = watch('parent_id')

  const [slug, setSlug] = useState('')
  useEffect(() => {
    setSlug(generateSlug(name ?? ''))
  }, [name])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div className="space-y-1">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register('name')} placeholder="e.g. Research" />
        {slug && (
          <p className="text-xs text-muted-foreground">Slug: {slug}</p>
        )}
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Label htmlFor="description">Description <span className="text-muted-foreground">(optional)</span></Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="What's this category for?"
          rows={2}
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Color picker */}
      <div className="space-y-1">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setValue('color', c)}
              className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: color === c ? 'white' : 'transparent',
                outline: color === c ? `2px solid ${c}` : 'none',
              }}
              aria-label={`Select color ${c}`}
            />
          ))}
        </div>
      </div>

      {/* Icon selector */}
      <div className="space-y-1">
        <Label>Icon <span className="text-muted-foreground">(optional)</span></Label>
        <div className="flex flex-wrap gap-1.5">
          {ICONS.map(i => (
            <button
              key={i}
              type="button"
              onClick={() => setValue('icon', i)}
              className="rounded-md border px-2.5 py-1 text-xs transition-colors hover:bg-muted"
              style={{
                backgroundColor: icon === i ? color + '22' : undefined,
                borderColor: icon === i ? color : undefined,
                color: icon === i ? color : undefined,
              }}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      {/* Parent category */}
      {parentOptions.length > 0 && (
        <div className="space-y-1">
          <Label>Parent category <span className="text-muted-foreground">(optional)</span></Label>
          <Select
            value={parent_id ?? ''}
            onValueChange={val => setValue('parent_id', val || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="None (top-level)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None (top-level)</SelectItem>
              {parentOptions.map(opt => (
                <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Saving…' : defaultValues?.name ? 'Update category' : 'Create category'}
      </Button>
    </form>
  )
}
