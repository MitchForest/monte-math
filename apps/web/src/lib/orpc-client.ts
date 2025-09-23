import { createApiClient } from '@monte/api-client'

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export const apiClient = createApiClient({
  baseUrl,
  getHeaders: () => ({
    'x-user-id': localStorage.getItem('userId') ?? ''
  })
})
