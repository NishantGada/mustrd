import { api, unlockConfig } from '@/lib/api'
import type { Board, Column, ColumnKind, Goal } from '@/types'

export async function fetchBoard(): Promise<Board> {
  const { data } = await api.get<Board>('/board')
  return data
}

export async function addColumn(name: string, kind: ColumnKind = 'normal'): Promise<Column> {
  const { data } = await api.post<Column>('/board/columns', { name, kind })
  return data
}

export async function updateColumn(
  columnId: string,
  body: { name?: string; kind?: ColumnKind },
): Promise<Column> {
  const { data } = await api.patch<Column>(`/columns/${columnId}`, body)
  return data
}

/** Delete a column. If it holds goals, `moveTo` names the column they move to. */
export async function deleteColumn(columnId: string, moveTo?: string): Promise<void> {
  await api.delete(`/columns/${columnId}`, { params: moveTo ? { move_to: moveTo } : undefined })
}

export async function reorderColumns(orderedIds: string[]): Promise<Column[]> {
  const { data } = await api.put<Column[]>('/board/columns/order', { ordered_ids: orderedIds })
  return data
}

export async function fetchBoardGoals(): Promise<Goal[]> {
  const { data } = await api.get<Goal[]>('/board/goals')
  return data
}

/** Fetch a single goal. Pass an unlock token to reveal a private goal. */
export async function fetchGoal(goalId: string, unlockToken?: string): Promise<Goal> {
  const { data } = await api.get<Goal>(`/goals/${goalId}`, unlockConfig(unlockToken))
  return data
}

export interface CreateGoalBody {
  column_id: string
  project_id?: string | null
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
  /** null moves the goal to "No project". Changing project gives it a new key. */
  project_id?: string | null
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
