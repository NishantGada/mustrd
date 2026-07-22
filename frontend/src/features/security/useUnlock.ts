import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { tokenStore } from '@/lib/storage'

import { unlockRequest } from './api'

function computeRemainingMs(): number {
  const expiresAt = tokenStore.getUnlockExpiresAt()
  if (!expiresAt) return 0
  return Math.max(0, expiresAt - Date.now())
}

/** Tracks the private-goal unlock grant client-side (for UI state/countdown).
 *  The server independently enforces real expiry on every request. */
export function useUnlock() {
  const qc = useQueryClient()
  const [remainingMs, setRemainingMs] = useState(computeRemainingMs)

  useEffect(() => {
    const id = window.setInterval(() => setRemainingMs(computeRemainingMs()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const isUnlocked = Boolean(tokenStore.getUnlock()) && remainingMs > 0

  async function unlock(passcode: string): Promise<void> {
    const { unlock_token, expires_in_seconds } = await unlockRequest(passcode)
    tokenStore.setUnlock(unlock_token, expires_in_seconds)
    setRemainingMs(expires_in_seconds * 1000)
    await qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'goals' })
  }

  async function lock(): Promise<void> {
    tokenStore.clearUnlock()
    setRemainingMs(0)
    await qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'goals' })
  }

  return { isUnlocked, remainingMs, unlock, lock }
}
