import {
  DndContext,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useMemo, useState } from 'react'

import { Plus } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { AddGoalModal } from '@/features/board/AddGoalModal'
import { BoardColumn } from '@/features/board/BoardColumn'
import { ALL_BOARDS, BoardSwitcher } from '@/features/board/BoardSwitcher'
import { MotherBoard } from '@/features/board/MotherBoard'
import {
  useBoardDetail,
  useBoardGoals,
  useBoards,
  useGoal,
  useMoveGoal,
} from '@/features/board/hooks'
import { groupByColumn } from '@/features/board/ordering'
import { GoalDetailPanel } from '@/features/goal-detail/GoalDetailPanel'
import { UnlockModal } from '@/features/security/UnlockModal'
import type { Goal } from '@/types'

export function BoardPage() {
  const boardsQuery = useBoards()
  const boards = useMemo(() => boardsQuery.data ?? [], [boardsQuery.data])
  const [selection, setSelection] = useState<string | null>(null) // board id | ALL_BOARDS | null(=first)
  const isAll = selection === ALL_BOARDS
  const boardId = isAll ? undefined : (selection ?? boards[0]?.id)

  const detailQuery = useBoardDetail(boardId)
  const goalsQuery = useBoardGoals(boardId)
  const move = useMoveGoal(boardId ?? '')

  // Unified goal open/unlock across the board and the motherboard.
  const [detail, setDetail] = useState<{ goal?: Goal; goalId: string; boardId: string; token?: string } | null>(null)
  const [unlocking, setUnlocking] = useState<{ goalId: string; boardId: string } | null>(null)
  const [showAddGoal, setShowAddGoal] = useState(false)

  const goalQuery = useGoal(detail?.goalId, detail?.token, detail?.goal)

  const goals = useMemo(() => goalsQuery.data ?? [], [goalsQuery.data])
  const grouped = useMemo(() => groupByColumn(goals), [goals])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function openGoal(goal: Goal, forBoardId: string): void {
    if (goal.is_locked) setUnlocking({ goalId: goal.id, boardId: forBoardId })
    else setDetail({ goal, goalId: goal.id, boardId: forBoardId })
  }

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

  if (boardsQuery.isLoading) return <p className="text-sm text-muted">Loading your board…</p>
  if (boardsQuery.isError) {
    return <p className="text-sm text-danger">Couldn’t load your boards. Try refreshing.</p>
  }

  const columns = [...(detailQuery.data?.columns ?? [])].sort((a, b) => a.position - b.position)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <BoardSwitcher
          boards={boards}
          currentBoardId={isAll ? ALL_BOARDS : (boardId ?? '')}
          onSelect={setSelection}
        />
        {!isAll && (
          <Button onClick={() => setShowAddGoal(true)} disabled={columns.length === 0}>
            <Plus width={16} height={16} />
            Add goal
          </Button>
        )}
      </div>

      {isAll ? (
        <MotherBoard onOpenGoal={(goal) => openGoal(goal, goal.board_id)} />
      ) : detailQuery.isLoading || goalsQuery.isLoading ? (
        <p className="text-sm text-muted">Loading your board…</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="flex min-h-[calc(100dvh-12rem)] gap-5 overflow-x-auto pb-4">
            {columns.map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                goals={grouped[column.id] ?? []}
                boardId={boardId!}
                onOpenGoal={(goal) => openGoal(goal, boardId!)}
              />
            ))}
          </div>
        </DndContext>
      )}

      {detail && goalQuery.data && (
        <GoalDetailPanel
          goal={goalQuery.data}
          boardId={detail.boardId}
          unlockToken={detail.token}
          onClose={() => setDetail(null)}
        />
      )}

      {unlocking && (
        <UnlockModal
          onClose={() => setUnlocking(null)}
          onUnlocked={(token) => {
            setDetail({ goalId: unlocking.goalId, boardId: unlocking.boardId, token })
            setUnlocking(null)
          }}
        />
      )}

      {showAddGoal && boardId && (
        <AddGoalModal boardId={boardId} columns={columns} onClose={() => setShowAddGoal(false)} />
      )}
    </div>
  )
}
