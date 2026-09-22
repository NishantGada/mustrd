/** Shared API types — mirror the backend Pydantic schemas. */

export type ColumnKind = 'normal' | 'terminal'

export interface User {
  id: string
  email: string
  username: string
  has_security_passcode: boolean
  is_superuser: boolean
  created_at: string
}

export interface ResetRequest {
  id: string
  user_email: string
  user_username: string
  status: 'pending' | 'rejected' | 'resolved'
  created_at: string
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

/** The user's single board. */
export interface Board {
  id: string
  name: string
  columns: Column[]
  created_at: string
  updated_at: string
}

/** Groups goals on the board. `key` is the ticket prefix, e.g. WORK → WORK-12.
 *  Projects nest to any depth via `parent_id` (null = top level). */
export interface Project {
  id: string
  parent_id: string | null
  name: string
  description: string | null
  key: string
  color: string
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  column_id: string
  /** Project, number and key are null on locked private goals. */
  project_id: string | null
  number: number | null
  key: string | null
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
