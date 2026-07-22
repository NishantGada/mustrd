import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

import { cn } from '@/lib/cn'
import type { Column, Goal } from '@/types'

import { GoalCard } from './GoalCard'
import { QuickAddGoal } from './QuickAddGoal'

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
    <div className="flex w-72 shrink-0 flex-col rounded-[var(--radius)] border border-border bg-bg">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-content">{column.name}</span>
          {column.kind === 'terminal' && (
            <span className="rounded-full bg-success/15 px-1.5 text-[10px] font-medium text-success">
              done
            </span>
          )}
        </div>
        <span className="text-xs text-faint">{goals.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 space-y-2 px-2 pb-2 transition-colors',
          isOver && 'bg-surface-2',
        )}
      >
        <SortableContext items={goals.map((g) => g.id)} strategy={verticalListSortingStrategy}>
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} boardId={boardId} onOpen={onOpenGoal} />
          ))}
        </SortableContext>
        <div className="pt-1">
          <QuickAddGoal boardId={boardId} columnId={column.id} />
        </div>
      </div>
    </div>
  )
}
