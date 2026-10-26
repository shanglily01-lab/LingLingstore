const DEFAULT_API_BASE_URL = 'http://localhost:3001'

export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL,
} as const
