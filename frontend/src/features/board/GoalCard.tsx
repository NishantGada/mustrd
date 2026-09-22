import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { useConfirm } from '@/components/ConfirmProvider'
import { Lock, X } from '@/components/icons'
import { NO_PROJECT_COLOR } from '@/features/projects/keys'
import { cn } from '@/lib/cn'
import type { Goal, Project } from '@/types'

import { ScoreBadge } from './ScoreBadge'
import { useDeleteGoal } from './hooks'

interface GoalCardProps {
  goal: Goal
  /** The goal's project, if it has one (never known for locked goals). */
  project?: Project
  onOpen: (goal: Goal) => void
}

export function GoalCard({ goal, project, onOpen }: GoalCardProps) {
  const confirm = useConfirm()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: goal.id,
    data: { type: 'goal', columnId: goal.column_id },
  })
  const del = useDeleteGoal()

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    // Project color on the left edge; neutral for "No project" and locked goals.
    borderLeftColor: project?.color ?? NO_PROJECT_COLOR,
  }
  const completed = Boolean(goal.completed_at)

  async function remove(): Promise<void> {
    const ok = await confirm({
      title: 'Delete goal?',
      message: `“${goal.title}” and its notes will be permanently deleted.`,
      confirmLabel: 'Delete goal',
      danger: true,
    })
    if (ok) del.mutate(goal.id)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(goal)}
      className={cn(
        'group relative cursor-grab touch-none rounded-[var(--radius-sm)] border border-l-4 border-border bg-surface p-3.5',
        'shadow-[var(--shadow-card)] transition-colors hover:border-accent/40 active:cursor-grabbing',
        isDragging && 'opacity-50',
      )}
    >
      {goal.is_locked ? (
        <div className="flex items-center gap-2 text-muted">
          <Lock width={15} height={15} />
          <span className="text-sm font-medium">Locked</span>
          <span className="ml-auto text-[11px] text-faint opacity-0 transition-opacity group-hover:opacity-100">
            Tap to unlock
          </span>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-2.5">
            {goal.score != null && <ScoreBadge score={goal.score} className="mt-0.5" />}
            <p
              className={cn(
                'flex-1 pr-4 text-sm leading-snug text-content',
                completed && 'text-muted line-through',
              )}
            >
              {goal.title}
            </p>
          </div>
          {goal.key && (
            <p className="mt-2 font-mono text-[11px] tracking-wide text-faint">{goal.key}</p>
          )}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              void remove()
            }}
            aria-label="Delete goal"
            className="absolute right-2 top-2 hidden text-faint hover:text-danger group-hover:block"
          >
            <X width={14} height={14} />
          </button>
        </>
      )}
    </div>
  )
}
