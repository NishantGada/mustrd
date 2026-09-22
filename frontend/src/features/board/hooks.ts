import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'

import type { ColumnKind, Goal } from '@/types'

import {
  addColumn,
  createGoal,
  deleteColumn,
  deleteGoal,
  fetchBoard,
  fetchBoardGoals,
  fetchGoal,
  moveGoal,
  reorderColumns,
  updateColumn,
  updateGoal,
  type CreateGoalBody,
  type MoveGoalBody,
  type UpdateGoalBody,
} from './api'
import { reorderGoals } from './ordering'

export const boardKeys = {
  board: ['board'] as const,
  goals: ['goals'] as const,
  goal: (id: string) => ['goal', id] as const,
}

const METRICS_KEY = ['metrics'] as const

/** Goals changed: refresh the board's goals and any metrics derived from them. */
function invalidateGoals(qc: QueryClient): void {
  qc.invalidateQueries({ queryKey: boardKeys.goals })
  qc.invalidateQueries({ queryKey: METRICS_KEY })
}

export function useBoard() {
  return useQuery({ queryKey: boardKeys.board, queryFn: fetchBoard })
}

export function useBoardGoals() {
  return useQuery({ queryKey: boardKeys.goals, queryFn: fetchBoardGoals })
}

export function useAddColumn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => addColumn(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.board }),
  })
}

export function useUpdateColumn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ columnId, body }: { columnId: string; body: { name?: string; kind?: ColumnKind } }) =>
      updateColumn(columnId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKeys.board })
      // A Done-status flip changes completion, so goals + metrics can shift.
      invalidateGoals(qc)
    },
  })
}

export function useDeleteColumn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ columnId, moveTo }: { columnId: string; moveTo?: string }) =>
      deleteColumn(columnId, moveTo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKeys.board })
      invalidateGoals(qc)
    },
  })
}

export function useReorderColumns() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderColumns(orderedIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.board }),
  })
}

/** Fetch one goal, optionally revealed with an unlock token. `initialData` lets
 *  a click open the detail instantly (from the board cache) then refetch.
 *  Not cached across unlock/lock states, so a locked goal is never served unmasked. */
export function useGoal(goalId: string | undefined, unlockToken?: string, initialData?: Goal) {
  return useQuery({
    queryKey: [...boardKeys.goal(goalId ?? ''), Boolean(unlockToken)],
    queryFn: () => fetchGoal(goalId!, unlockToken),
    enabled: Boolean(goalId),
    initialData,
    gcTime: 0,
    staleTime: 0,
  })
}

export function useCreateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateGoalBody) => createGoal(body),
    onSuccess: () => invalidateGoals(qc),
  })
}

export function useUpdateGoal(unlockToken?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ goalId, body }: { goalId: string; body: UpdateGoalBody }) =>
      updateGoal(goalId, body, unlockToken),
    onSuccess: (goal) => {
      invalidateGoals(qc)
      qc.invalidateQueries({ queryKey: boardKeys.goal(goal.id) })
    },
  })
}

export function useDeleteGoal(unlockToken?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (goalId: string) => deleteGoal(goalId, unlockToken),
    onSuccess: () => invalidateGoals(qc),
  })
}

/** Move with optimistic reordering so the drag feels instant. */
export function useMoveGoal() {
  const qc = useQueryClient()
  const key = boardKeys.goals
  return useMutation({
    mutationFn: (body: MoveGoalBody) => moveGoal(body),
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<Goal[]>(key)
      if (previous) {
        qc.setQueryData<Goal[]>(
          key,
          reorderGoals(previous, body.goalId, body.target_column_id, body.position),
        )
      }
      return { previous }
    },
    onError: (_err, _body, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous)
    },
    onSettled: () => invalidateGoals(qc),
  })
}
