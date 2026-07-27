import { useState } from 'react'

import { useAuth } from '@/features/auth/AuthContext'
import { useBoards } from '@/features/board/hooks'
import { useMetrics } from '@/features/metrics/hooks'
import { StatTile } from '@/features/metrics/StatTile'
import { cn } from '@/lib/cn'
import { formatMonth } from '@/lib/dates'

export function ProfilePage() {
  const { user } = useAuth()
  const boardsQuery = useBoards()
  const boards = boardsQuery.data ?? []
  const [scope, setScope] = useState<string>('all') // 'all' or a board id
  const { data: metrics, isLoading, isError } = useMetrics(scope === 'all' ? undefined : scope)

  const scopes = [{ id: 'all', name: 'All boards' }, ...boards]

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-lg font-semibold text-content">
          {user?.username.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{user?.username}</h1>
          <p className="text-sm text-muted">{user?.email}</p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {scopes.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setScope(s.id)}
            className={cn(
              'rounded-full border px-3 py-1 text-sm transition-colors',
              scope === s.id
                ? 'border-transparent bg-primary text-primary-content'
                : 'border-border text-muted hover:text-content',
            )}
          >
            {s.name}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-muted">Loading your metrics…</p>}
      {isError && <p className="text-sm text-danger">Couldn’t load your metrics.</p>}

      {metrics && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatTile
            label="Active goals"
            value={metrics.active_goals}
            info="Goals you haven't finished yet — everything not currently in a Done (terminal) column."
          />
          <StatTile
            label="Completed goals"
            value={metrics.completed_goals}
            hint="All time"
            info="Goals currently sitting in a Done column. Moving a goal back out makes it active again, so this reflects your current completed count."
          />
          <StatTile
            label="Total goals"
            value={metrics.total_goals}
            info="Every goal you've created that still exists (active + completed)."
          />
          <StatTile
            label="Efficiency"
            value={`${Math.round(metrics.efficiency * 100)}%`}
            hint="Priority-weighted completion rate"
            info="How much of your important work is done. It's the sum of the scores of your completed goals ÷ the sum of the scores of all your goals, shown as a percentage — so finishing a score-5 goal moves it more than a score-1."
          />
          <StatTile
            label="Average score"
            value={metrics.average_score != null ? metrics.average_score.toFixed(1) : '—'}
            info="The mean importance score (1–5) across all your goals — a sense of how high-priority your board skews."
          />
          <StatTile
            label="Best month"
            value={metrics.best_month ? metrics.best_month.completed : '—'}
            hint={metrics.best_month ? formatMonth(metrics.best_month.month) : 'No completions yet'}
            info="The calendar month (UTC) in which you completed the most goals, counted from your completion history — so it stays accurate even if goals are later reopened or moved."
          />
        </div>
      )}
    </div>
  )
}
