import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { apiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/cn'
import type { Board } from '@/types'

import { useCreateBoard } from './hooks'

interface BoardSwitcherProps {
  boards: Board[]
  currentBoardId: string
  onSelect: (boardId: string) => void
}

export function BoardSwitcher({ boards, currentBoardId, onSelect }: BoardSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const current = boards.find((b) => b.id === currentBoardId)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded px-1 py-0.5 text-2xl font-semibold tracking-tight text-content hover:text-accent"
      >
        {current?.name ?? 'Board'}
        <span className="text-sm text-muted">▾</span>
      </button>

      {open && (
        <>
          {/* Click-away layer */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-2 w-64 overflow-hidden rounded-[var(--radius)] border border-border bg-surface py-1 shadow-[var(--shadow-pop)]">
            {boards.map((board) => (
              <button
                key={board.id}
                type="button"
                onClick={() => {
                  onSelect(board.id)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-surface-2',
                  board.id === currentBoardId ? 'text-content' : 'text-muted',
                )}
              >
                {board.name}
                {board.id === currentBoardId && <span className="text-accent">✓</span>}
              </button>
            ))}
            <div className="my-1 border-t border-border" />
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setCreating(true)
              }}
              className="w-full px-3 py-2 text-left text-sm text-accent hover:bg-surface-2"
            >
              ＋ New board
            </button>
          </div>
        </>
      )}

      {creating && (
        <CreateBoardModal
          onClose={() => setCreating(false)}
          onCreated={(board) => {
            setCreating(false)
            onSelect(board.id)
          }}
        />
      )}
    </div>
  )
}

function CreateBoardModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (board: Board) => void
}) {
  const createBoard = useCreateBoard()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(e: React.FormEvent): void {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setError(null)
    createBoard.mutate(trimmed, {
      onSuccess: onCreated,
      onError: (err) => setError(apiErrorMessage(err, 'Could not create the board.')),
    })
  }

  return (
    <Modal title="New board" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Board name" htmlFor="board-name">
          <Input
            id="board-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Side Projects"
          />
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={createBoard.isPending || !name.trim()}>
          {createBoard.isPending ? 'Creating…' : 'Create board'}
        </Button>
      </form>
    </Modal>
  )
}
