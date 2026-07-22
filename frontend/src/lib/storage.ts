/** Token storage. Access token persists (localStorage); the private-goal unlock
 *  grant is session-only (sessionStorage) so it clears when the tab closes. */
const ACCESS_KEY = 'mustrd.access_token'
const UNLOCK_KEY = 'mustrd.unlock_token'
const UNLOCK_EXPIRES_KEY = 'mustrd.unlock_expires_at'

export const tokenStore = {
  getAccess: (): string | null => localStorage.getItem(ACCESS_KEY),
  setAccess: (token: string): void => localStorage.setItem(ACCESS_KEY, token),
  clearAccess: (): void => localStorage.removeItem(ACCESS_KEY),

  getUnlock: (): string | null => sessionStorage.getItem(UNLOCK_KEY),
  /** `expiresInSeconds` is used only for the client-side countdown UI; the
   *  server independently enforces the token's real expiry. */
  setUnlock: (token: string, expiresInSeconds: number): void => {
    sessionStorage.setItem(UNLOCK_KEY, token)
    sessionStorage.setItem(UNLOCK_EXPIRES_KEY, String(Date.now() + expiresInSeconds * 1000))
  },
  clearUnlock: (): void => {
    sessionStorage.removeItem(UNLOCK_KEY)
    sessionStorage.removeItem(UNLOCK_EXPIRES_KEY)
  },
  getUnlockExpiresAt: (): number | null => {
    const raw = sessionStorage.getItem(UNLOCK_EXPIRES_KEY)
    return raw ? Number(raw) : null
  },
}
