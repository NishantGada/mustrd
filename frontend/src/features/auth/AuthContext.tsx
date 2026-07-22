import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

import { api } from '@/lib/api'
import { tokenStore } from '@/lib/storage'
import type { User } from '@/types'

type Status = 'loading' | 'authed' | 'anon'

interface AuthContextValue {
  user: User | null
  status: Status
  login: (accessToken: string) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<Status>('loading')

  async function loadMe(): Promise<void> {
    try {
      const { data } = await api.get<User>('/auth/me')
      setUser(data)
      setStatus('authed')
    } catch {
      tokenStore.clearAccess()
      setUser(null)
      setStatus('anon')
    }
  }

  useEffect(() => {
    if (tokenStore.getAccess()) void loadMe()
    else setStatus('anon')
  }, [])

  async function login(accessToken: string): Promise<void> {
    tokenStore.setAccess(accessToken)
    setStatus('loading')
    await loadMe()
  }

  function logout(): void {
    tokenStore.clearAccess()
    tokenStore.clearUnlock()
    setUser(null)
    setStatus('anon')
  }

  return (
    <AuthContext.Provider value={{ user, status, login, logout, refresh: loadMe }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
