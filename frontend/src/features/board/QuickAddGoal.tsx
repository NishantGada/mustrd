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
  const [focused, setFocused] = useState(false)
  const create = useCreateGoal(boardId)

  const expanded = focused || title.length > 0

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
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="+ Add a goal"
        className="h-9 border-transparent bg-transparent hover:bg-surface focus:bg-surface"
      />
      {expanded && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted">Score</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                // Keep focus so the row doesn't collapse mid-selection.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setScore(n)}
                className={cn(
                  'h-6 w-6 rounded text-xs font-medium transition-colors',
                  score === n
                    ? 'bg-primary text-primary-content'
                    : 'bg-surface text-muted hover:text-content',
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  )
}
