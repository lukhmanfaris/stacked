'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CategoryTree, CategoryFormData } from '@/types/category'

async function fetchCategories(): Promise<CategoryTree[]> {
  const res = await fetch('/api/categories')
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message ?? 'Failed to fetch categories')
  return json.data
}

async function createCategory(data: CategoryFormData) {
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message ?? 'Failed to create category')
  return json.data
}

async function updateCategory(id: string, data: Partial<CategoryFormData>) {
  const res = await fetch(`/api/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message ?? 'Failed to update category')
  return json.data
}

async function deleteCategory(id: string) {
  const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message ?? 'Failed to delete category')
}

async function reorderCategories(items: { id: string; sort_order: number }[]) {
  const res = await fetch('/api/categories/reorder', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(items),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message ?? 'Failed to reorder categories')
}

export function useCategories() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 1000 * 60,
  })

  // Flatten tree to a single list for dropdowns / pickers
  const flatCategories = (query.data ?? []).flatMap(cat => [cat, ...cat.children])

  const addCategory = useMutation({
    mutationFn: (data: CategoryFormData) => createCategory(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })

  const editCategory = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryFormData> }) =>
      updateCategory(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })

  const removeCategory = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })

  const reorder = useMutation({
    mutationFn: (items: { id: string; sort_order: number }[]) => reorderCategories(items),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })

  return {
    categories: query.data ?? [],
    flatCategories,
    isLoading: query.isLoading,
    error: query.error,
    addCategory: (data: CategoryFormData) => addCategory.mutateAsync(data),
    updateCategory: (id: string, data: Partial<CategoryFormData>) =>
      editCategory.mutateAsync({ id, data }),
    deleteCategory: (id: string) => removeCategory.mutateAsync(id),
    reorderCategories: (items: { id: string; sort_order: number }[]) => reorder.mutateAsync(items),
  }
}
