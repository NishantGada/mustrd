import { api } from '@/lib/api'
import type { Board, BoardWithColumns, Goal } from '@/types'

export async function fetchBoards(): Promise<Board[]> {
  const { data } = await api.get<Board[]>('/boards')
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

export async function updateGoal(goalId: string, body: UpdateGoalBody): Promise<Goal> {
  const { data } = await api.patch<Goal>(`/goals/${goalId}`, body)
  return data
}

export async function deleteGoal(goalId: string): Promise<void> {
  await api.delete(`/goals/${goalId}`)
}
