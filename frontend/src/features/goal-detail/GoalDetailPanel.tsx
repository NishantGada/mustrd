import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useDeleteGoal, useUpdateGoal } from '@/features/board/hooks'
import { ScoreBadge } from '@/features/board/ScoreBadge'
import { apiErrorMessage } from '@/lib/api'
import { dateInputToISO, formatDateTime, toDateInputValue } from '@/lib/dates'
import type { Goal } from '@/types'

import { NotesSection } from './NotesSection'

interface GoalDetailPanelProps {
  goal: Goal
  boardId: string
  onClose: () => void
  onRequestUnlock?: () => void
}

export function GoalDetailPanel({ goal, boardId, onClose, onRequestUnlock }: GoalDetailPanelProps) {
  const updateGoal = useUpdateGoal(boardId)
  const deleteGoal = useDeleteGoal(boardId)

  const [title, setTitle] = useState(goal.title)
  const [description, setDescription] = useState(goal.description ?? '')
  const [score, setScore] = useState(goal.score ?? 3)
  const [dueDate, setDueDate] = useState(toDateInputValue(goal.due_date))
  const [error, setError] = useState<string | null>(null)

  // Re-sync local edit state whenever a different (or freshly-unlocked) goal is shown.
  useEffect(() => {
    setTitle(goal.title)
    setDescription(goal.description ?? '')
    setScore(goal.score ?? 3)
    setDueDate(toDateInputValue(goal.due_date))
    setError(null)
  }, [goal.id, goal.title, goal.description, goal.score, goal.due_date])

  function save(): void {
    setError(null)
    updateGoal.mutate(
      {
        goalId: goal.id,
        body: {
          title: title.trim() || goal.title,
          description: description.trim() ? description : null,
          score,
          due_date: dateInputToISO(dueDate),
        },
      },
      { onError: (e) => setError(apiErrorMessage(e, 'Could not save changes.')) },
    )
  }

  function toggleSecured(next: boolean): void {
    setError(null)
    updateGoal.mutate(
      { goalId: goal.id, body: { is_secured: next } },
      { onError: (e) => setError(apiErrorMessage(e, 'Could not update privacy.')) },
    )
  }

  return (
    <div
      className="fixed inset-0 z-20 grid place-items-center bg-[var(--overlay)] p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-y-auto rounded-[var(--radius)] border border-border bg-surface p-6 shadow-[var(--shadow-pop)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {goal.score != null && <ScoreBadge score={goal.score} />}
            <span className="text-xs text-faint">
              Created {formatDateTime(goal.created_at)}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-content"
          >
            ✕
          </button>
        </div>

        {goal.is_locked ? (
          <div className="rounded-sm border border-dashed border-border p-4 text-sm text-muted">
            🔒 This goal is private. Unlock it to view or edit its details and notes.
            {onRequestUnlock && (
              <Button size="sm" variant="outline" className="mt-3" onClick={onRequestUnlock}>
                Unlock
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <Field label="Title" htmlFor="goal-title">
                <Input id="goal-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>

              <Field label="Description" htmlFor="goal-desc">
                <Textarea
                  id="goal-desc"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does done look like?"
                />
              </Field>

              <div className="flex items-end gap-4">
                <Field label="Score" htmlFor="goal-score">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setScore(n)}
                        className={`h-8 w-8 rounded text-sm font-medium ${
                          score === n
                            ? 'bg-primary text-primary-content'
                            : 'bg-surface-2 text-muted hover:text-content'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Due date" htmlFor="goal-due">
                  <Input
                    id="goal-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </Field>
              </div>

              <label className="flex items-center gap-2 text-sm text-content">
                <input
                  type="checkbox"
                  checked={goal.is_secured}
                  onChange={(e) => toggleSecured(e.target.checked)}
                />
                Private goal (requires passcode to view)
              </label>

              {error && <p className="text-sm text-danger">{error}</p>}

              <div className="flex gap-2">
                <Button onClick={save} disabled={updateGoal.isPending}>
                  {updateGoal.isPending ? 'Saving…' : 'Save changes'}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (confirm('Delete this goal permanently?')) {
                      deleteGoal.mutate(goal.id, { onSuccess: onClose })
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>

            <div className="border-t border-border pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
              <NotesSection goalId={goal.id} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
