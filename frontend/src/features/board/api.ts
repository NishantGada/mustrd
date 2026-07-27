import { api, unlockConfig } from '@/lib/api'
import type { Board, BoardWithColumns, Column, ColumnKind, Goal } from '@/types'

export async function fetchBoards(): Promise<Board[]> {
  const { data } = await api.get<Board[]>('/boards')
  return data
}

export async function createBoard(name: string): Promise<Board> {
  const { data } = await api.post<Board>('/boards', { name })
  return data
}

export async function updateBoard(boardId: string, name: string): Promise<Board> {
  const { data } = await api.patch<Board>(`/boards/${boardId}`, { name })
  return data
}

export async function deleteBoard(boardId: string): Promise<void> {
  await api.delete(`/boards/${boardId}`)
}

export async function addColumn(
  boardId: string,
  name: string,
  kind: ColumnKind = 'normal',
): Promise<Column> {
  const { data } = await api.post<Column>(`/boards/${boardId}/columns`, { name, kind })
  return data
}

export async function updateColumn(
  columnId: string,
  body: { name?: string; kind?: ColumnKind },
): Promise<Column> {
  const { data } = await api.patch<Column>(`/columns/${columnId}`, body)
  return data
}

export async function deleteColumn(columnId: string): Promise<void> {
  await api.delete(`/columns/${columnId}`)
}

export async function reorderColumns(boardId: string, orderedIds: string[]): Promise<Column[]> {
  const { data } = await api.put<Column[]>(`/boards/${boardId}/columns/order`, {
    ordered_ids: orderedIds,
  })
  return data
}

export async function fetchBoardDetail(boardId: string): Promise<BoardWithColumns> {
  const { data } = await api.get<BoardWithColumns>(`/boards/${boardId}`)
  return data
}

export async function fetchBoardGoals(boardId: string): Promise<Goal[]> {
  const { data } = await api.get<Goal[]>(`/boards/${boardId}/goals`)
  return data
}

/** Fetch a single goal. Pass an unlock token to reveal a private goal. */
export async function fetchGoal(goalId: string, unlockToken?: string): Promise<Goal> {
  const { data } = await api.get<Goal>(`/goals/${goalId}`, unlockConfig(unlockToken))
  return data
}

export interface CreateGoalBody {
  column_id: string
  title: string
  score: number
  description?: string | null
  due_date?: string | null
  is_secured?: boolean
}

export async function createGoal(body: CreateGoalBody): Promise<Goal> {
  const { data } = await api.post<Goal>('/goals', body)
  return data
}

export interface MoveGoalBody {
  goalId: string
  target_column_id: string
  position: number
}

export async function moveGoal({ goalId, ...body }: MoveGoalBody): Promise<Goal> {
  const { data } = await api.post<Goal>(`/goals/${goalId}/move`, body)
  return data
}

export interface UpdateGoalBody {
  title?: string
  description?: string | null
  score?: number
  due_date?: string | null
  is_secured?: boolean
}

export async function updateGoal(
  goalId: string,
  body: UpdateGoalBody,
  unlockToken?: string,
): Promise<Goal> {
  const { data } = await api.patch<Goal>(`/goals/${goalId}`, body, unlockConfig(unlockToken))
  return data
}

export async function deleteGoal(goalId: string, unlockToken?: string): Promise<void> {
  await api.delete(`/goals/${goalId}`, unlockConfig(unlockToken))
}
