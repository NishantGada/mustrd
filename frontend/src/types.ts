/** Shared API types — mirror the backend Pydantic schemas. */

export type ColumnKind = 'normal' | 'terminal'

export interface User {
  id: string
  email: string
  username: string
  has_security_passcode: boolean
  created_at: string
}

export interface Board {
  id: string
  name: string
  position: number
  created_at: string
  updated_at: string
}

export interface Column {
  id: string
  board_id: string
  name: string
  position: number
  kind: ColumnKind
  created_at: string
  updated_at: string
}

export interface BoardWithColumns extends Board {
  columns: Column[]
}

export interface Goal {
  id: string
  column_id: string
  title: string
  description: string | null
  score: number | null
  position: number
  due_date: string | null
  is_secured: boolean
  is_locked: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  goal_id: string
  body: string
  created_at: string
  updated_at: string
}

export interface Metrics {
  total_goals: number
  active_goals: number
  completed_goals: number
  efficiency: number
  average_score: number | null
  best_month: { month: string; completed: number } | null
}

export interface AuthToken {
  access_token: string
  token_type: string
}
