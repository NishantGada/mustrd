import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { Goal } from '@/types'

import type { ColumnKind } from '@/types'

import {
  addColumn,
  createBoard,
  createGoal,
  deleteBoard,
  deleteColumn,
  deleteGoal,
  fetchAllGoals,
  fetchBoardDetail,
  fetchBoardGoals,
  fetchBoards,
  fetchGoal,
  moveGoal,
  reorderColumns,
  updateBoard,
  updateColumn,
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

export function useUpdateBoard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ boardId, name }: { boardId: string; name: string }) =>
      updateBoard(boardId, name),
    onSuccess: (board) => {
      qc.invalidateQueries({ queryKey: boardKeys.boards })
      qc.invalidateQueries({ queryKey: boardKeys.detail(board.id) })
    },
  })
}

export function useDeleteBoard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (boardId: string) => deleteBoard(boardId),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.boards }),
  })
}

export function useAddColumn(boardId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => addColumn(boardId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.detail(boardId) }),
  })
}

export function useUpdateColumn(boardId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ columnId, body }: { columnId: string; body: { name?: string; kind?: ColumnKind } }) =>
      updateColumn(columnId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKeys.detail(boardId) })
      // A Done-status flip changes completion, so goals + metrics can shift.
      qc.invalidateQueries({ queryKey: boardKeys.goals(boardId) })
    },
  })
}

export function useDeleteColumn(boardId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (columnId: string) => deleteColumn(columnId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKeys.detail(boardId) })
      qc.invalidateQueries({ queryKey: boardKeys.goals(boardId) })
    },
  })
}

export function useReorderColumns(boardId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderColumns(boardId, orderedIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.detail(boardId) }),
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

/** All goals across every board — powers the aggregate "motherboard" view. */
export function useAllGoals(enabled: boolean) {
  return useQuery({ queryKey: ['all-goals'], queryFn: fetchAllGoals, enabled })
}

/** Fetch one goal, optionally revealed with an unlock token. `initialData` lets
 *  a click open the detail instantly (from board/aggregate cache) then refetch.
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

const ALL_GOALS_KEY = ['all-goals'] as const

export function useCreateGoal(boardId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateGoalBody) => createGoal(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKeys.goals(boardId) })
      qc.invalidateQueries({ queryKey: ALL_GOALS_KEY })
    },
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
      qc.invalidateQueries({ queryKey: ALL_GOALS_KEY })
    },
  })
}

export function useDeleteGoal(boardId: string, unlockToken?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (goalId: string) => deleteGoal(goalId, unlockToken),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKeys.goals(boardId) })
      qc.invalidateQueries({ queryKey: ALL_GOALS_KEY })
    },
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
