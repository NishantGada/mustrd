/** Token storage. The access token persists in localStorage. Private-goal
 *  unlock grants are intentionally NOT persisted — each locked goal is unlocked
 *  on demand and the grant lives only in memory for that viewing. */
const ACCESS_KEY = 'mustrd.access_token'

export const tokenStore = {
  getAccess: (): string | null => localStorage.getItem(ACCESS_KEY),
  setAccess: (token: string): void => localStorage.setItem(ACCESS_KEY, token),
  clearAccess: (): void => localStorage.removeItem(ACCESS_KEY),
}
