import {
  DndContext,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useMemo, useState } from 'react'

import { AddGoalModal } from '@/features/board/AddGoalModal'
import { BoardColumn } from '@/features/board/BoardColumn'
import { BoardSwitcher } from '@/features/board/BoardSwitcher'
import { useBoardDetail, useBoardGoals, useBoards, useMoveGoal } from '@/features/board/hooks'
import { groupByColumn } from '@/features/board/ordering'
import { Button } from '@/components/ui/Button'
import { GoalDetailPanel } from '@/features/goal-detail/GoalDetailPanel'
import { UnlockModal } from '@/features/security/UnlockModal'

export function BoardPage() {
  const boardsQuery = useBoards()
  const boards = useMemo(() => boardsQuery.data ?? [], [boardsQuery.data])
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
  const boardId = selectedBoardId ?? boards[0]?.id
  const detailQuery = useBoardDetail(boardId)
  const goalsQuery = useBoardGoals(boardId)
  const move = useMoveGoal(boardId ?? '')
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [showAddGoal, setShowAddGoal] = useState(false)

  const goals = useMemo(() => goalsQuery.data ?? [], [goalsQuery.data])
  const grouped = useMemo(() => groupByColumn(goals), [goals])
  const selectedGoal = goals.find((g) => g.id === selectedGoalId) ?? null

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event
    if (!over) return
    const activeId = String(active.id)
    const overId = String(over.id)

    const activeGoal = goals.find((g) => g.id === activeId)
    if (!activeGoal) return

    let targetColumnId: string
    let targetIndex: number

    if (overId.startsWith('col:')) {
      targetColumnId = overId.slice(4)
      targetIndex = grouped[targetColumnId]?.length ?? 0
    } else {
      const overGoal = goals.find((g) => g.id === overId)
      if (!overGoal) return
      targetColumnId = overGoal.column_id
      targetIndex = (grouped[targetColumnId] ?? []).findIndex((g) => g.id === overId)
    }

    const sameSpot =
      activeGoal.column_id === targetColumnId &&
      (grouped[targetColumnId] ?? []).findIndex((g) => g.id === activeId) === targetIndex
    if (sameSpot) return

    move.mutate({ goalId: activeId, target_column_id: targetColumnId, position: targetIndex })
  }

  if (boardsQuery.isLoading || detailQuery.isLoading || goalsQuery.isLoading) {
    return <p className="text-sm text-muted">Loading your board…</p>
  }
  if (boardsQuery.isError || detailQuery.isError || goalsQuery.isError) {
    return <p className="text-sm text-danger">Couldn’t load your board. Try refreshing.</p>
  }

  const columns = [...(detailQuery.data?.columns ?? [])].sort((a, b) => a.position - b.position)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <BoardSwitcher
          boards={boards}
          currentBoardId={boardId!}
          onSelect={setSelectedBoardId}
        />
        <Button onClick={() => setShowAddGoal(true)} disabled={columns.length === 0}>
          ＋ Add goal
        </Button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex min-h-[calc(100dvh-12rem)] gap-5 overflow-x-auto pb-4">
          {columns.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
              goals={grouped[column.id] ?? []}
              boardId={boardId!}
              onOpenGoal={setSelectedGoalId}
            />
          ))}
        </div>
      </DndContext>

      {selectedGoal && (
        <GoalDetailPanel
          goal={selectedGoal}
          boardId={boardId!}
          onClose={() => setSelectedGoalId(null)}
          onRequestUnlock={() => setShowUnlockModal(true)}
        />
      )}

      {showAddGoal && (
        <AddGoalModal
          boardId={boardId!}
          columns={columns}
          onClose={() => setShowAddGoal(false)}
        />
      )}

      {showUnlockModal && <UnlockModal onClose={() => setShowUnlockModal(false)} />}
    </div>
  )
}
