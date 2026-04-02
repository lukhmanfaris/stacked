export interface ApiResponse<T> {
  data: T | null
  error: ApiErrorBody | null
  status: number
}

export interface ApiErrorBody {
  code: string
  message: string
  details?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    per_page: number
    total_count: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
}
