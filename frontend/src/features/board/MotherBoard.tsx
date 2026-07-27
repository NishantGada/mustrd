import { useMemo } from 'react'

import { Lock } from '@/components/icons'
import { cn } from '@/lib/cn'
import type { GoalWithContext } from '@/types'

import { ScoreBadge } from './ScoreBadge'
import { useAllGoals } from './hooks'

/** Aggregate "motherboard": every goal across all boards, merged into one
 *  read-only kanban by column name. Cards carry a board tag; click to open. */
export function MotherBoard({ onOpenGoal }: { onOpenGoal: (goal: GoalWithContext) => void }) {
  const { data, isLoading, isError } = useAllGoals(true)
  const goals = useMemo(() => data ?? [], [data])

  const columns = useMemo(() => {
    const byName = new Map<string, { name: string; minPos: number; goals: GoalWithContext[] }>()
    for (const goal of goals) {
      const entry = byName.get(goal.column_name) ?? {
        name: goal.column_name,
        minPos: goal.column_position,
        goals: [],
      }
      entry.minPos = Math.min(entry.minPos, goal.column_position)
      entry.goals.push(goal)
      byName.set(goal.column_name, entry)
    }
    return [...byName.values()].sort((a, b) => a.minPos - b.minPos || a.name.localeCompare(b.name))
  }, [goals])

  if (isLoading) return <p className="text-sm text-muted">Loading all goals…</p>
  if (isError) return <p className="text-sm text-danger">Couldn’t load your goals.</p>
  if (goals.length === 0) {
    return <p className="text-sm text-faint">No goals yet — add some from a board.</p>
  }

  return (
    <div className="flex min-h-[calc(100dvh-12rem)] gap-5 overflow-x-auto pb-4">
      {columns.map((col) => (
        <div
          key={col.name}
          className="flex min-w-[15rem] flex-1 flex-col rounded-[var(--radius)] border border-border bg-surface-2/40"
        >
          <div className="flex items-center justify-between px-4 pb-3 pt-4">
            <span className="text-sm font-semibold text-content">{col.name}</span>
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-surface px-1.5 text-xs text-muted">
              {col.goals.length}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-2.5 px-3 pb-3">
            {col.goals.map((goal) => (
              <AggregateGoalCard key={goal.id} goal={goal} onOpen={onOpenGoal} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function AggregateGoalCard({
  goal,
  onOpen,
}: {
  goal: GoalWithContext
  onOpen: (goal: GoalWithContext) => void
}) {
  const completed = Boolean(goal.completed_at)
  return (
    <button
      type="button"
      onClick={() => onOpen(goal)}
      className="w-full rounded-[var(--radius-sm)] border border-border bg-surface p-3.5 text-left shadow-[var(--shadow-card)] transition-colors hover:border-accent/40"
    >
      {goal.is_locked ? (
        <div className="flex items-center gap-2 text-muted">
          <Lock width={15} height={15} />
          <span className="text-sm font-medium">Locked</span>
        </div>
      ) : (
        <div className="flex items-start gap-2.5">
          {goal.score != null && <ScoreBadge score={goal.score} className="mt-0.5" />}
          <p
            className={cn(
              'flex-1 text-sm leading-snug text-content',
              completed && 'text-muted line-through',
            )}
          >
            {goal.title}
          </p>
        </div>
      )}
      <div className="mt-2">
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-muted">
          {goal.board_name}
        </span>
      </div>
    </button>
  )
}
