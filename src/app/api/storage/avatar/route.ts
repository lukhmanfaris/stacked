import { createClient } from '@/lib/supabase/server'
import { apiSuccess, handleApiError } from '@/lib/api-response'
import { UnauthorizedError, ValidationError } from '@/lib/errors'
import { uploadFile, deleteFile, avatarPath } from '@/lib/storage'
import { LIMITS } from '@/lib/constants'

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new UnauthorizedError()

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      throw new ValidationError([{ field: 'file', message: 'File is required' }])
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      throw new ValidationError([{ field: 'file', message: 'Must be PNG, JPEG, or WebP' }])
    }

    const maxBytes = LIMITS.AVATAR_MAX_SIZE_KB * 1024
    if (file.size > maxBytes) {
      throw new ValidationError([
        { field: 'file', message: `File must be under ${LIMITS.AVATAR_MAX_SIZE_KB} KB` },
      ])
    }

    const buffer = await file.arrayBuffer()
    const path = avatarPath(user.id)

    const { publicUrl } = await uploadFile('avatars', path, buffer, file.type, supabase)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    if (updateError) throw updateError

    return apiSuccess({ avatar_url: publicUrl })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new UnauthorizedError()

    await deleteFile('avatars', avatarPath(user.id), supabase)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.id)

    if (updateError) throw updateError

    return apiSuccess({ avatar_url: null })
  } catch (error) {
    return handleApiError(error)
  }
}
