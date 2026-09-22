import { useState } from 'react'

import { useConfirm } from '@/components/ConfirmProvider'
import { ChevronDown, Plus, X } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { apiErrorMessage } from '@/lib/api'
import type { Column } from '@/types'

import {
  useAddColumn,
  useBoard,
  useBoardGoals,
  useDeleteColumn,
  useReorderColumns,
  useUpdateColumn,
} from './hooks'

/** Settings section: rename, add, delete, reorder, and mark Done columns on the
 *  board. Columns are shared by every project. */
export function ColumnManagement() {
  const boardQuery = useBoard()
  const goalsQuery = useBoardGoals()
  const addColumn = useAddColumn()
  const reorderColumns = useReorderColumns()
  const [newColumn, setNewColumn] = useState('')
  const [error, setError] = useState<string | null>(null)

  const columns = [...(boardQuery.data?.columns ?? [])].sort((a, b) => a.position - b.position)
  const goalCounts = (goalsQuery.data ?? []).reduce<Record<string, number>>((acc, g) => {
    acc[g.column_id] = (acc[g.column_id] ?? 0) + 1
    return acc
  }, {})

  function move(index: number, delta: number): void {
    const next = [...columns]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    reorderColumns.mutate(next.map((c) => c.id))
  }

  return (
    <section className="rounded-[var(--radius)] border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold text-content">Board columns</h2>
      <p className="mt-1 text-sm text-muted">
        Shared by every project. At least one column must be marked Done.
      </p>

      {!boardQuery.data ? (
        <p className="mt-4 text-sm text-muted">Loading…</p>
      ) : (
        <div className="mt-4">
          <ul className="space-y-2">
            {columns.map((column, index) => (
              <ColumnRow
                key={column.id}
                column={column}
                columns={columns}
                goalCount={goalCounts[column.id] ?? 0}
                isFirst={index === 0}
                isLast={index === columns.length - 1}
                onMoveUp={() => move(index, -1)}
                onMoveDown={() => move(index, 1)}
                onError={setError}
              />
            ))}
          </ul>

          {error && <p className="mt-3 text-sm text-danger">{error}</p>}

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
      )}
    </section>
  )
}

function ColumnRow({
  column,
  columns,
  goalCount,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onError,
}: {
  column: Column
  columns: Column[]
  goalCount: number
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onError: (message: string | null) => void
}) {
  const confirm = useConfirm()
  const updateColumn = useUpdateColumn()
  const deleteColumn = useDeleteColumn()
  const [name, setName] = useState(column.name)
  const [choosingTarget, setChoosingTarget] = useState(false)
  const onFail = (fallback: string) => (err: unknown) => onError(apiErrorMessage(err, fallback))

  function saveName(): void {
    const trimmed = name.trim()
    if (trimmed && trimmed !== column.name) {
      onError(null)
      updateColumn.mutate(
        { columnId: column.id, body: { name: trimmed } },
        { onError: onFail('Could not rename the column.') },
      )
    }
  }

  async function remove(): Promise<void> {
    onError(null)
    // Goals are never deleted with a column — ask where they should go instead.
    if (goalCount > 0) {
      setChoosingTarget(true)
      return
    }
    const ok = await confirm({
      title: 'Delete column?',
      message: `Delete the empty “${column.name}” column.`,
      confirmLabel: 'Delete column',
      danger: true,
    })
    if (ok) {
      deleteColumn.mutate(
        { columnId: column.id },
        { onError: onFail('Could not delete the column.') },
      )
    }
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
          onChange={(e) => {
            onError(null)
            updateColumn.mutate(
              { columnId: column.id, body: { kind: e.target.checked ? 'terminal' : 'normal' } },
              { onError: onFail('Could not update the column.') },
            )
          }}
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

      {choosingTarget && (
        <MoveGoalsModal
          column={column}
          goalCount={goalCount}
          targets={columns.filter((c) => c.id !== column.id)}
          onClose={() => setChoosingTarget(false)}
        />
      )}
    </li>
  )
}

/** Deleting a non-empty column: pick where its goals go, then delete. */
function MoveGoalsModal({
  column,
  goalCount,
  targets,
  onClose,
}: {
  column: Column
  goalCount: number
  targets: Column[]
  onClose: () => void
}) {
  const deleteColumn = useDeleteColumn()
  const [moveTo, setMoveTo] = useState(targets[0]?.id ?? '')
  const [error, setError] = useState<string | null>(null)

  function submit(e: React.FormEvent): void {
    e.preventDefault()
    if (!moveTo) return
    setError(null)
    deleteColumn.mutate(
      { columnId: column.id, moveTo },
      {
        onSuccess: onClose,
        onError: (err) => setError(apiErrorMessage(err, 'Could not delete the column.')),
      },
    )
  }

  return (
    <Modal title={`Delete “${column.name}”?`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-muted">
          It has {goalCount} goal{goalCount === 1 ? '' : 's'}. Choose a column to move{' '}
          {goalCount === 1 ? 'it' : 'them'} to — nothing gets deleted except the column.
        </p>
        <select
          value={moveTo}
          onChange={(e) => setMoveTo(e.target.value)}
          aria-label="Move goals to"
          className="h-10 w-full rounded border border-border bg-surface px-3 text-sm text-content focus:border-accent focus:outline-none"
        >
          {targets.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
              {t.kind === 'terminal' ? ' (Done)' : ''}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" disabled={!moveTo || deleteColumn.isPending}>
            {deleteColumn.isPending ? 'Deleting…' : 'Move goals & delete'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
