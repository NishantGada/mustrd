/** Project key + color helpers. Rules mirror the backend (app/schemas/project.py). */

/** Prefix for goals without a project; no project may use it. */
export const UNASSIGNED_KEY = 'TBD'

/** Filter/metrics value that selects goals with no project. */
export const NO_PROJECT = 'none'

/** Neutral edge color for goals with no project (and locked goals). */
export const NO_PROJECT_COLOR = 'var(--border)'

export const PRESET_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
]

const KEY_RE = /^[A-Z][A-Z0-9]{1,9}$/

/** Returns an error message, or null when the key is valid. */
export function validateKey(key: string): string | null {
  if (!KEY_RE.test(key)) return 'Use 2–10 letters or digits, starting with a letter.'
  if (key === UNASSIGNED_KEY) return `${UNASSIGNED_KEY} is reserved for goals without a project.`
  return null
}

/** Suggest a key from a project name: initials for multi-word names ("Side
 *  Projects" → SP), otherwise the word itself ("Work" → WORK), capped at 10. */
export function suggestKey(name: string): string {
  const words = name.toUpperCase().match(/[A-Z0-9]+/g) ?? []
  let key = words.length > 1 ? words.map((w) => w[0]).join('') : (words[0] ?? '')
  if (key.length < 2 && words.length > 1) key = words.join('')
  key = key.slice(0, 10)
  if (/^[0-9]/.test(key)) key = `P${key}`.slice(0, 10)
  return key === UNASSIGNED_KEY ? `${key}1` : key
}
