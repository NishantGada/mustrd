import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { apiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/cn'
import type { Column } from '@/types'

import { useCreateGoal } from './hooks'

interface AddGoalModalProps {
  boardId: string
  columns: Column[]
  onClose: () => void
}

export function AddGoalModal({ boardId, columns, onClose }: AddGoalModalProps) {
  // New goals always start in the first column (e.g. "To Do").
  const firstColumn = [...columns].sort((a, b) => a.position - b.position)[0]
  const create = useCreateGoal(boardId)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [score, setScore] = useState(3)
  const [error, setError] = useState<string | null>(null)

  function submit(e: React.FormEvent): void {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed || !firstColumn) return
    setError(null)
    create.mutate(
      {
        column_id: firstColumn.id,
        title: trimmed,
        score,
        description: description.trim() ? description : null,
      },
      {
        onSuccess: onClose,
        onError: (err) => setError(apiErrorMessage(err, 'Could not add the goal.')),
      },
    )
  }

  return (
    <Modal title="Add a goal" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title" htmlFor="add-title">
          <Input
            id="add-title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What do you want to get done?"
          />
        </Field>
        <Field label="Description" htmlFor="add-desc">
          <Textarea
            id="add-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details…"
          />
        </Field>
        <Field label="Score" htmlFor="add-score">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setScore(n)}
                className={cn(
                  'h-9 w-9 rounded text-sm font-medium transition-colors',
                  score === n
                    ? 'bg-primary text-primary-content'
                    : 'bg-surface-2 text-muted hover:text-content',
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </Field>
        {firstColumn && (
          <p className="text-xs text-faint">Added to “{firstColumn.name}”.</p>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={create.isPending || !firstColumn}>
          {create.isPending ? 'Adding…' : 'Add goal'}
        </Button>
      </form>
    </Modal>
  )
}
