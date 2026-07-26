import { api } from '@/lib/api'
import type { ResetRequest } from '@/types'

export async function requestReset(email: string): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>('/password-reset/requests', { email })
  return data
}

export async function fetchResetRequests(): Promise<ResetRequest[]> {
  const { data } = await api.get<ResetRequest[]>('/password-reset/requests')
  return data
}

export async function rejectResetRequest(id: string): Promise<void> {
  await api.post(`/password-reset/requests/${id}/reject`)
}

export async function resolveResetRequest(id: string, newPassword: string): Promise<void> {
  await api.post(`/password-reset/requests/${id}/resolve`, { new_password: newPassword })
}
