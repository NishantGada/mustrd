import { api } from '@/lib/api'
import type { AuthToken, User } from '@/types'

export interface LoginBody {
  email: string
  password: string
}

export interface RegisterBody {
  email: string
  username: string
  password: string
}

export async function loginRequest(body: LoginBody): Promise<AuthToken> {
  const { data } = await api.post<AuthToken>('/auth/login', body)
  return data
}

export async function registerRequest(body: RegisterBody): Promise<User> {
  const { data } = await api.post<User>('/auth/register', body)
  return data
}
