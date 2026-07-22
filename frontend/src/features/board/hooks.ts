import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { Goal } from '@/types'

import {
  createBoard,
  createGoal,
  deleteGoal,
  fetchBoardDetail,
  fetchBoardGoals,
  fetchBoards,
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

export function useCreateGoal(boardId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateGoalBody) => createGoal(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.goals(boardId) }),
  })
}

export function useUpdateGoal(boardId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ goalId, body }: { goalId: string; body: UpdateGoalBody }) =>
      updateGoal(goalId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.goals(boardId) }),
  })
}

export function useDeleteGoal(boardId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (goalId: string) => deleteGoal(goalId),
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
