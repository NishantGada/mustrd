/** Light/dark handling. The actual colors live in styles/theme.css; this only
 *  toggles the `.dark` class and remembers the choice. */
export type ThemeMode = 'light' | 'dark'

const KEY = 'mustrd.theme'

export function resolveInitialMode(): ThemeMode {
  const stored = localStorage.getItem(KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyMode(mode: ThemeMode): void {
  document.documentElement.classList.toggle('dark', mode === 'dark')
  localStorage.setItem(KEY, mode)
}
