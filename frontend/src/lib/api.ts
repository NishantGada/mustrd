import axios from 'axios'

import { tokenStore } from './storage'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const api = axios.create({ baseURL })

// Attach the JWT and, when present, the private-goal unlock grant.
api.interceptors.request.use((config) => {
  const access = tokenStore.getAccess()
  if (access) config.headers.Authorization = `Bearer ${access}`
  const unlock = tokenStore.getUnlock()
  if (unlock) config.headers['X-Unlock-Token'] = unlock
  return config
})

/** Extract a human-friendly message from an Axios error's FastAPI `detail`. */
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg
  }
  return fallback
}
