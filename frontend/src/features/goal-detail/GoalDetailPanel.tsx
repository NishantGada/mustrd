import { useEffect, useState } from 'react'

import { useConfirm } from '@/components/ConfirmProvider'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { X } from '@/components/icons'
import { useDeleteGoal, useUpdateGoal } from '@/features/board/hooks'
import { ScoreBadge } from '@/features/board/ScoreBadge'
import { apiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/cn'
import { dateInputToISO, formatDateTime, toDateInputValue } from '@/lib/dates'
import type { Goal } from '@/types'

import { NotesSection } from './NotesSection'

interface GoalDetailPanelProps {
  goal: Goal
  boardId: string
  onClose: () => void
  /** Present when viewing a just-unlocked private goal; threads through to edits/notes. */
  unlockToken?: string
}

export function GoalDetailPanel({ goal, boardId, onClose, unlockToken }: GoalDetailPanelProps) {
  const confirm = useConfirm()
  const updateGoal = useUpdateGoal(boardId, unlockToken)
  const deleteGoal = useDeleteGoal(boardId, unlockToken)

  const [title, setTitle] = useState(goal.title)
  const [description, setDescription] = useState(goal.description ?? '')
  const [score, setScore] = useState(goal.score ?? 3)
  const [dueDate, setDueDate] = useState(toDateInputValue(goal.due_date))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTitle(goal.title)
    setDescription(goal.description ?? '')
    setScore(goal.score ?? 3)
    setDueDate(toDateInputValue(goal.due_date))
    setError(null)
  }, [goal.id, goal.title, goal.description, goal.score, goal.due_date])

  // Only allow (and show) a save when something actually changed — avoids the
  // no-op request and the button flashing "Saving…" on an unchanged form.
  const isDirty =
    title !== goal.title ||
    description !== (goal.description ?? '') ||
    score !== (goal.score ?? 3) ||
    dueDate !== toDateInputValue(goal.due_date)

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

  async function remove(): Promise<void> {
    const ok = await confirm({
      title: 'Delete goal?',
      message: `“${goal.title}” and its notes will be permanently deleted.`,
      confirmLabel: 'Delete goal',
      danger: true,
    })
    if (ok) deleteGoal.mutate(goal.id, { onSuccess: onClose })
  }

  return (
    <div
      className="fixed inset-0 z-20 grid place-items-center bg-[var(--overlay)] p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-y-auto rounded-[var(--radius)] border border-border bg-surface p-10 shadow-[var(--shadow-pop)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-8 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            {goal.score != null && <ScoreBadge score={goal.score} />}
            <span className="text-xs text-faint">Created {formatDateTime(goal.created_at)}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted transition-colors hover:text-content"
          >
            <X width={18} height={18} />
          </button>
        </div>

        <div className="grid gap-12 md:grid-cols-2">
          <div className="space-y-6">
            <Field label="Title" htmlFor="goal-title">
              <Input id="goal-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>

            <Field label="Description" htmlFor="goal-desc">
              <Textarea
                id="goal-desc"
                rows={7}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does done look like?"
              />
            </Field>

            <div className="flex items-end gap-8">
              <Field label="Score" htmlFor="goal-score">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setScore(n)}
                      className={cn(
                        'h-10 w-10 rounded text-sm font-medium transition-colors',
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

            <div className="flex gap-3 pt-1">
              <Button
                onClick={save}
                disabled={!isDirty || updateGoal.isPending}
                className="min-w-[7.5rem]"
              >
                {updateGoal.isPending ? 'Saving…' : 'Save changes'}
              </Button>
              <Button variant="danger" onClick={() => void remove()}>
                Delete
              </Button>
            </div>
          </div>

          <div className="border-t border-border pt-8 md:border-l md:border-t-0 md:pl-12 md:pt-0">
            <NotesSection goalId={goal.id} unlockToken={unlockToken} />
          </div>
        </div>
      </div>
    </div>
  )
}
