import { NextResponse } from 'next/server'
import { AppError, ValidationError, TierLimitError } from './errors'

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null, status }, { status })
}

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: Record<string, string[]>,
) {
  return NextResponse.json(
    { data: null, error: { code, message, details: details ?? null }, status },
    { status }
  )
}

export function handleApiError(error: unknown) {
  if (error instanceof ValidationError) {
    return apiError(
      error.code,
      error.message,
      error.statusCode,
      Object.fromEntries(error.errors.map(e => [e.field, [e.message]]))
    )
  }

  if (error instanceof TierLimitError) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          limit: error.limit,
          current: error.current,
          resource: error.resource,
        },
        status: error.statusCode,
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof AppError && error.isOperational) {
    return apiError(error.code, error.message, error.statusCode)
  }

  console.error('[API] Unexpected error:', error)
  return apiError('INTERNAL_ERROR', 'An unexpected error occurred', 500)
}
