import { useCallback, useState } from 'react'

/** Multi-select project filter (project ids and/or NO_PROJECT). An empty
 *  selection means "everything". Optionally remembered in localStorage. */
export function useProjectFilter(storageKey?: string) {
  const [selected, setSelected] = useState<string[]>(() => {
    if (!storageKey) return []
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
      return Array.isArray(saved) ? saved.filter((v) => typeof v === 'string') : []
    } catch {
      return []
    }
  })

  const update = useCallback(
    (next: string[]) => {
      setSelected(next)
      if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next))
    },
    [storageKey],
  )

  return [selected, update] as const
}

/** localStorage key for the board's filter (also used to deep-link to a project). */
export const BOARD_FILTER_STORAGE_KEY = 'mustrd.board_project_filter'
