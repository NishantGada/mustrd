import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

import { cn } from '@/lib/cn'
import type { Column, Goal } from '@/types'

import { GoalCard } from './GoalCard'

interface BoardColumnProps {
  column: Column
  goals: Goal[]
  boardId: string
  onOpenGoal: (goalId: string) => void
}

export function BoardColumn({ column, goals, boardId, onOpenGoal }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col:${column.id}`,
    data: { type: 'column', columnId: column.id },
  })

  return (
    <div className="flex w-80 shrink-0 flex-col rounded-[var(--radius)] border border-border bg-surface-2/40">
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-content">{column.name}</span>
          {column.kind === 'terminal' && (
            <span className="rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-medium text-success">
              done
            </span>
          )}
        </div>
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-surface px-1.5 text-xs text-muted">
          {goals.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-1 flex-col gap-2.5 rounded-b-[var(--radius)] px-3 pb-3 transition-colors',
          isOver && 'bg-accent/5',
        )}
      >
        <SortableContext items={goals.map((g) => g.id)} strategy={verticalListSortingStrategy}>
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} boardId={boardId} onOpen={onOpenGoal} />
          ))}
        </SortableContext>
        {goals.length === 0 && (
          <div className="grid flex-1 place-items-center rounded-[var(--radius-sm)] border border-dashed border-border/60 py-8 text-xs text-faint">
            Drop goals here
          </div>
        )}
      </div>
    </div>
  )
}
