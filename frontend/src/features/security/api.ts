import { api } from '@/lib/api'

export interface SetPasscodeBody {
  passcode: string
  current_passcode?: string
}

export async function setPasscodeRequest(body: SetPasscodeBody): Promise<void> {
  await api.put('/security/passcode', body)
}

export interface UnlockResponse {
  unlock_token: string
  expires_in_seconds: number
}

export async function unlockRequest(passcode: string): Promise<UnlockResponse> {
  const { data } = await api.post<UnlockResponse>('/security/unlock', { passcode })
  return data
}
