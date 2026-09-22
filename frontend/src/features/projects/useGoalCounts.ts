import { useMemo } from 'react'

import { useBoardGoals } from '@/features/board/hooks'
import type { Project } from '@/types'

import { withDescendants } from './tree'

export interface GoalCount {
  total: number
  done: number
}

/** Goal counts per project, each rolled up to include its subprojects. Locked
 *  goals don't reveal their project, so they aren't counted. */
export function useGoalCounts(projects: Project[]): Record<string, GoalCount> {
  const goalsQuery = useBoardGoals()
  return useMemo(() => {
    const own: Record<string, GoalCount> = {}
    for (const g of goalsQuery.data ?? []) {
      if (!g.project_id) continue
      const entry = (own[g.project_id] ??= { total: 0, done: 0 })
      entry.total += 1
      if (g.completed_at) entry.done += 1
    }
    const rolled: Record<string, GoalCount> = {}
    for (const p of projects) {
      const sum = { total: 0, done: 0 }
      for (const id of withDescendants(projects, [p.id])) {
        sum.total += own[id]?.total ?? 0
        sum.done += own[id]?.done ?? 0
      }
      rolled[p.id] = sum
    }
    return rolled
  }, [goalsQuery.data, projects])
}
