import { useState } from 'react'

import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/cn'

import { useCreateGoal } from './hooks'

interface QuickAddGoalProps {
  boardId: string
  columnId: string
}

export function QuickAddGoal({ boardId, columnId }: QuickAddGoalProps) {
  const [title, setTitle] = useState('')
  const [score, setScore] = useState(3)
  const create = useCreateGoal(boardId)

  function submit(e: React.FormEvent): void {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    create.mutate(
      { column_id: columnId, title: trimmed, score },
      { onSuccess: () => setTitle('') },
    )
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a goal…"
        className="h-9"
      />
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted">Score</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setScore(n)}
              className={cn(
                'h-6 w-6 rounded text-xs font-medium',
                score === n
                  ? 'bg-primary text-primary-content'
                  : 'bg-surface-2 text-muted hover:text-content',
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </form>
  )
}
