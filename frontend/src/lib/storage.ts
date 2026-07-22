/** Token storage. Access token persists (localStorage); the private-goal unlock
 *  grant is session-only (sessionStorage) so it clears when the tab closes. */
const ACCESS_KEY = 'mustrd.access_token'
const UNLOCK_KEY = 'mustrd.unlock_token'

export const tokenStore = {
  getAccess: (): string | null => localStorage.getItem(ACCESS_KEY),
  setAccess: (token: string): void => localStorage.setItem(ACCESS_KEY, token),
  clearAccess: (): void => localStorage.removeItem(ACCESS_KEY),

  getUnlock: (): string | null => sessionStorage.getItem(UNLOCK_KEY),
  setUnlock: (token: string): void => sessionStorage.setItem(UNLOCK_KEY, token),
  clearUnlock: (): void => sessionStorage.removeItem(UNLOCK_KEY),
}
