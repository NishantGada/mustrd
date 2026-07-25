import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { Goal } from '@/types'

import {
  createBoard,
  createGoal,
  deleteGoal,
  fetchBoardDetail,
  fetchBoardGoals,
  fetchBoards,
  fetchGoal,
  moveGoal,
  updateGoal,
  type CreateGoalBody,
  type MoveGoalBody,
  type UpdateGoalBody,
} from './api'
import { reorderGoals } from './ordering'

export const boardKeys = {
  boards: ['boards'] as const,
  detail: (id: string) => ['board', id] as const,
  goals: (id: string) => ['goals', id] as const,
  goal: (id: string) => ['goal', id] as const,
}

export function useBoards() {
  return useQuery({ queryKey: boardKeys.boards, queryFn: fetchBoards })
}

export function useCreateBoard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => createBoard(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.boards }),
  })
}

export function useBoardDetail(boardId: string | undefined) {
  return useQuery({
    queryKey: boardKeys.detail(boardId ?? ''),
    queryFn: () => fetchBoardDetail(boardId!),
    enabled: Boolean(boardId),
  })
}

export function useBoardGoals(boardId: string | undefined) {
  return useQuery({
    queryKey: boardKeys.goals(boardId ?? ''),
    queryFn: () => fetchBoardGoals(boardId!),
    enabled: Boolean(boardId),
  })
}

/** Fetch one goal, optionally revealed with an unlock token. Not cached across
 *  unlock/lock states, so a locked goal is never served unmasked from cache. */
export function useGoal(goalId: string | undefined, unlockToken?: string) {
  return useQuery({
    queryKey: [...boardKeys.goal(goalId ?? ''), Boolean(unlockToken)],
    queryFn: () => fetchGoal(goalId!, unlockToken),
    enabled: Boolean(goalId),
    gcTime: 0,
    staleTime: 0,
  })
}

export function useCreateGoal(boardId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateGoalBody) => createGoal(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.goals(boardId) }),
  })
}

export function useUpdateGoal(boardId: string, unlockToken?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ goalId, body }: { goalId: string; body: UpdateGoalBody }) =>
      updateGoal(goalId, body, unlockToken),
    onSuccess: (goal) => {
      qc.invalidateQueries({ queryKey: boardKeys.goals(boardId) })
      qc.invalidateQueries({ queryKey: boardKeys.goal(goal.id) })
    },
  })
}

export function useDeleteGoal(boardId: string, unlockToken?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (goalId: string) => deleteGoal(goalId, unlockToken),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.goals(boardId) }),
  })
}

/** Move with optimistic reordering so the drag feels instant. */
export function useMoveGoal(boardId: string) {
  const qc = useQueryClient()
  const key = boardKeys.goals(boardId)
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
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })
}
