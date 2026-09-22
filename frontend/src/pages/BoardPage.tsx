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
import { useBoard, useBoardGoals, useGoal, useMoveGoal } from '@/features/board/hooks'
import { groupByColumn } from '@/features/board/ordering'
import { GoalDetailPanel } from '@/features/goal-detail/GoalDetailPanel'
import { NO_PROJECT } from '@/features/projects/keys'
import { ProjectFilter } from '@/features/projects/ProjectFilter'
import { useProjects } from '@/features/projects/hooks'
import { BOARD_FILTER_STORAGE_KEY, useProjectFilter } from '@/features/projects/useProjectFilter'
import { UnlockModal } from '@/features/security/UnlockModal'
import type { Goal, Project } from '@/types'

export function BoardPage() {
  const boardQuery = useBoard()
  const goalsQuery = useBoardGoals()
  const projectsQuery = useProjects()
  const move = useMoveGoal()

  const [detail, setDetail] = useState<{ goal?: Goal; goalId: string; token?: string } | null>(null)
  const [unlockingId, setUnlockingId] = useState<string | null>(null)
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [storedFilter, setFilter] = useProjectFilter(BOARD_FILTER_STORAGE_KEY)

  const goalQuery = useGoal(detail?.goalId, detail?.token, detail?.goal)

  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data])
  const projectsById = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p])) as Record<string, Project>,
    [projects],
  )
  // Drop remembered selections for projects that have since been deleted.
  const filter = useMemo(
    () => storedFilter.filter((id) => id === NO_PROJECT || id in projectsById),
    [storedFilter, projectsById],
  )

  const goals = useMemo(() => goalsQuery.data ?? [], [goalsQuery.data])
  // Full per-column order — drag positions are computed against this, so hidden
  // (filtered-out) goals keep their places.
  const grouped = useMemo(() => groupByColumn(goals), [goals])
  const visibleGrouped = useMemo(() => {
    if (filter.length === 0) return grouped
    // A locked goal's project is withheld, so it only shows on the unfiltered board.
    const matches = (g: Goal) =>
      !g.is_locked && filter.includes(g.project_id ?? NO_PROJECT)
    return Object.fromEntries(
      Object.entries(grouped).map(([columnId, list]) => [columnId, list.filter(matches)]),
    )
  }, [grouped, filter])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function openGoal(goal: Goal): void {
    if (goal.is_locked) setUnlockingId(goal.id)
    else setDetail({ goal, goalId: goal.id })
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

  if (boardQuery.isLoading || goalsQuery.isLoading) {
    return <p className="text-sm text-muted">Loading your board…</p>
  }
  if (boardQuery.isError || goalsQuery.isError) {
    return <p className="text-sm text-danger">Couldn’t load your board. Try refreshing.</p>
  }

  const columns = [...(boardQuery.data?.columns ?? [])].sort((a, b) => a.position - b.position)
  const singleProject = filter.length === 1 && filter[0] !== NO_PROJECT ? filter[0] : undefined

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <ProjectFilter projects={projects} selected={filter} onChange={setFilter} />
        <Button onClick={() => setShowAddGoal(true)} disabled={columns.length === 0}>
          <Plus width={16} height={16} />
          Add goal
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex min-h-[calc(100dvh-12rem)] gap-5 overflow-x-auto pb-4">
          {columns.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
              goals={visibleGrouped[column.id] ?? []}
              projectsById={projectsById}
              onOpenGoal={openGoal}
            />
          ))}
        </div>
      </DndContext>

      {detail && goalQuery.data && (
        <GoalDetailPanel
          goal={goalQuery.data}
          projects={projects}
          unlockToken={detail.token}
          onClose={() => setDetail(null)}
        />
      )}

      {unlockingId && (
        <UnlockModal
          onClose={() => setUnlockingId(null)}
          onUnlocked={(token) => {
            setDetail({ goalId: unlockingId, token })
            setUnlockingId(null)
          }}
        />
      )}

      {showAddGoal && (
        <AddGoalModal
          columns={columns}
          projects={projects}
          defaultProjectId={singleProject}
          onClose={() => setShowAddGoal(false)}
        />
      )}
    </div>
  )
}
