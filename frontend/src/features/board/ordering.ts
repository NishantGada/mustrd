import type { Goal } from '@/types'

/** Group goals by column id, each list sorted by position. */
export function groupByColumn(goals: Goal[]): Record<string, Goal[]> {
  const groups: Record<string, Goal[]> = {}
  for (const goal of goals) {
    ;(groups[goal.column_id] ??= []).push(goal)
  }
  for (const list of Object.values(groups)) {
    list.sort((a, b) => a.position - b.position)
  }
  return groups
}

/**
 * Pure reordering used for optimistic updates: move `goalId` into
 * `targetColumnId` at `targetIndex`, renumbering affected columns' positions.
 * Mirrors the backend's reindex-on-move behavior.
 */
export function reorderGoals(
  goals: Goal[],
  goalId: string,
  targetColumnId: string,
  targetIndex: number,
): Goal[] {
  const moving = goals.find((g) => g.id === goalId)
  if (!moving) return goals

  const groups = groupByColumn(goals)
  const sourceColumnId = moving.column_id

  // Remove from source.
  groups[sourceColumnId] = (groups[sourceColumnId] ?? []).filter((g) => g.id !== goalId)

  // Insert into target at the clamped index.
  const target = (groups[targetColumnId] ??= [])
  const index = Math.max(0, Math.min(targetIndex, target.length))
  const updatedMoving: Goal = { ...moving, column_id: targetColumnId }
  target.splice(index, 0, updatedMoving)

  // Renumber positions in every touched column and flatten back out.
  const touched = new Set([sourceColumnId, targetColumnId])
  const result: Goal[] = []
  for (const goal of goals) {
    if (goal.id === goalId) continue
    if (!touched.has(goal.column_id)) result.push(goal)
  }
  for (const columnId of touched) {
    ;(groups[columnId] ?? []).forEach((goal, i) => {
      result.push({ ...goal, position: i })
    })
  }
  return result
}
