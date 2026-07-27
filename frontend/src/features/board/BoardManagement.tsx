import { useState } from 'react'

import { useConfirm } from '@/components/ConfirmProvider'
import { ChevronDown, Plus, X } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/cn'
import type { Column } from '@/types'

import {
  useAddColumn,
  useBoardDetail,
  useBoardGoals,
  useBoards,
  useDeleteBoard,
  useDeleteColumn,
  useReorderColumns,
  useUpdateBoard,
  useUpdateColumn,
} from './hooks'

export function BoardManagement() {
  const boardsQuery = useBoards()
  const boards = boardsQuery.data ?? []
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const boardId = selectedId ?? boards[0]?.id

  return (
    <section className="rounded-[var(--radius)] border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold text-content">Boards</h2>
      <p className="mt-1 text-sm text-muted">Rename boards, and edit their columns.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {boards.map((board) => (
          <button
            key={board.id}
            type="button"
            onClick={() => setSelectedId(board.id)}
            className={cn(
              'rounded-full border px-3 py-1 text-sm transition-colors',
              board.id === boardId
                ? 'border-transparent bg-primary text-primary-content'
                : 'border-border text-muted hover:text-content',
            )}
          >
            {board.name}
          </button>
        ))}
      </div>

      {boardId && (
        <BoardEditor key={boardId} boardId={boardId} onDeleted={() => setSelectedId(null)} />
      )}
    </section>
  )
}

function BoardEditor({ boardId, onDeleted }: { boardId: string; onDeleted: () => void }) {
  const confirm = useConfirm()
  const detail = useBoardDetail(boardId)
  const goalsQuery = useBoardGoals(boardId)
  const updateBoard = useUpdateBoard()
  const deleteBoard = useDeleteBoard()
  const addColumn = useAddColumn(boardId)
  const reorderColumns = useReorderColumns(boardId)

  const [name, setName] = useState('')
  const [newColumn, setNewColumn] = useState('')

  const board = detail.data
  const columns = [...(board?.columns ?? [])].sort((a, b) => a.position - b.position)
  const goalCounts = (goalsQuery.data ?? []).reduce<Record<string, number>>((acc, g) => {
    acc[g.column_id] = (acc[g.column_id] ?? 0) + 1
    return acc
  }, {})

  if (!board) return <p className="mt-4 text-sm text-muted">Loading…</p>

  function move(index: number, delta: number): void {
    const next = [...columns]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    reorderColumns.mutate(next.map((c) => c.id))
  }

  async function removeBoard(): Promise<void> {
    const ok = await confirm({
      title: 'Delete board?',
      message: `“${board!.name}” and all its columns and goals will be permanently deleted.`,
      confirmLabel: 'Delete board',
      danger: true,
    })
    if (ok) deleteBoard.mutate(boardId, { onSuccess: onDeleted })
  }

  return (
    <div className="mt-5 space-y-6 border-t border-border pt-5">
      {/* Rename / delete board */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-content">Board name</label>
          <Input
            defaultValue={board.name}
            onChange={(e) => setName(e.target.value)}
            placeholder={board.name}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => name.trim() && updateBoard.mutate({ boardId, name: name.trim() })}
          disabled={!name.trim() || name.trim() === board.name}
        >
          Rename
        </Button>
        <Button variant="danger" onClick={() => void removeBoard()}>
          Delete
        </Button>
      </div>

      {/* Columns */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-content">Columns</h3>
        <ul className="space-y-2">
          {columns.map((column, index) => (
            <ColumnRow
              key={column.id}
              boardId={boardId}
              column={column}
              goalCount={goalCounts[column.id] ?? 0}
              isFirst={index === 0}
              isLast={index === columns.length - 1}
              onMoveUp={() => move(index, -1)}
              onMoveDown={() => move(index, 1)}
            />
          ))}
        </ul>

        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const trimmed = newColumn.trim()
            if (trimmed) addColumn.mutate(trimmed, { onSuccess: () => setNewColumn('') })
          }}
        >
          <Input
            value={newColumn}
            onChange={(e) => setNewColumn(e.target.value)}
            placeholder="New column name"
            className="h-9"
          />
          <Button type="submit" size="sm" variant="outline" disabled={!newColumn.trim()}>
            <Plus width={15} height={15} />
            Add
          </Button>
        </form>
      </div>
    </div>
  )
}

function ColumnRow({
  boardId,
  column,
  goalCount,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
}: {
  boardId: string
  column: Column
  goalCount: number
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const confirm = useConfirm()
  const updateColumn = useUpdateColumn(boardId)
  const deleteColumn = useDeleteColumn(boardId)
  const [name, setName] = useState(column.name)

  function saveName(): void {
    const trimmed = name.trim()
    if (trimmed && trimmed !== column.name) {
      updateColumn.mutate({ columnId: column.id, body: { name: trimmed } })
    }
  }

  async function remove(): Promise<void> {
    const ok = await confirm({
      title: 'Delete column?',
      message:
        goalCount > 0
          ? `“${column.name}” has ${goalCount} goal${goalCount === 1 ? '' : 's'}, which will also be permanently deleted.`
          : `Delete the empty “${column.name}” column.`,
      confirmLabel: 'Delete column',
      danger: true,
    })
    if (ok) deleteColumn.mutate(column.id)
  }

  return (
    <li className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-bg p-2">
      <div className="flex flex-col">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          aria-label="Move up"
          className="text-faint hover:text-content disabled:opacity-30"
        >
          <ChevronDown width={14} height={14} className="rotate-180" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          aria-label="Move down"
          className="text-faint hover:text-content disabled:opacity-30"
        >
          <ChevronDown width={14} height={14} />
        </button>
      </div>

      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={saveName}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className="h-8 flex-1"
      />

      <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-muted">
        <input
          type="checkbox"
          checked={column.kind === 'terminal'}
          onChange={(e) =>
            updateColumn.mutate({
              columnId: column.id,
              body: { kind: e.target.checked ? 'terminal' : 'normal' },
            })
          }
        />
        Done column
      </label>

      <span className="w-14 text-right text-xs text-faint">
        {goalCount} goal{goalCount === 1 ? '' : 's'}
      </span>

      <button
        type="button"
        onClick={() => void remove()}
        aria-label="Delete column"
        className="text-faint hover:text-danger"
      >
        <X width={15} height={15} />
      </button>
    </li>
  )
}
