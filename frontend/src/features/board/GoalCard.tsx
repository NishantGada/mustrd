import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { cn } from '@/lib/cn'
import type { Goal } from '@/types'

import { ScoreBadge } from './ScoreBadge'
import { useDeleteGoal } from './hooks'

interface GoalCardProps {
  goal: Goal
  boardId: string
  onOpen: (goalId: string) => void
}

export function GoalCard({ goal, boardId, onOpen }: GoalCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: goal.id,
    data: { type: 'goal', columnId: goal.column_id },
  })
  const del = useDeleteGoal(boardId)

  const style = { transform: CSS.Translate.toString(transform), transition }
  const completed = Boolean(goal.completed_at)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(goal.id)}
      className={cn(
        'group relative cursor-grab touch-none rounded-[var(--radius-sm)] border border-border bg-surface p-3.5',
        'shadow-[var(--shadow-card)] transition-colors hover:border-accent/40 active:cursor-grabbing',
        isDragging && 'opacity-50',
      )}
    >
      <div className="flex items-start gap-2.5">
        {goal.score != null && <ScoreBadge score={goal.score} className="mt-0.5" />}
        <p
          className={cn(
            'flex-1 pr-4 text-sm leading-snug text-content',
            completed && 'text-muted line-through',
          )}
        >
          {goal.is_locked && <span className="mr-1">🔒</span>}
          {goal.title}
        </p>
      </div>

      {!goal.is_locked && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => {
            if (confirm('Delete this goal?')) del.mutate(goal.id)
          }}
          aria-label="Delete goal"
          className="absolute right-1.5 top-1.5 hidden rounded px-1 text-xs text-faint hover:text-danger group-hover:block"
        >
          ✕
        </button>
      )}
    </div>
  )
}
