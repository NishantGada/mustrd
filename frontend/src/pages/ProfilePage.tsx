import { useAuth } from '@/features/auth/AuthContext'
import { useMetrics } from '@/features/metrics/hooks'
import { StatTile } from '@/features/metrics/StatTile'
import { formatMonth } from '@/lib/dates'

export function ProfilePage() {
  const { user } = useAuth()
  const { data: metrics, isLoading, isError } = useMetrics()

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

      {isLoading && <p className="text-sm text-muted">Loading your metrics…</p>}
      {isError && <p className="text-sm text-danger">Couldn’t load your metrics.</p>}

      {metrics && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatTile label="Active goals" value={metrics.active_goals} />
          <StatTile label="Completed goals" value={metrics.completed_goals} hint="All time" />
          <StatTile label="Total goals" value={metrics.total_goals} />
          <StatTile
            label="Efficiency"
            value={`${Math.round(metrics.efficiency * 100)}%`}
            hint="Priority-weighted completion rate"
          />
          <StatTile
            label="Average score"
            value={metrics.average_score != null ? metrics.average_score.toFixed(1) : '—'}
          />
          <StatTile
            label="Best month"
            value={metrics.best_month ? metrics.best_month.completed : '—'}
            hint={metrics.best_month ? formatMonth(metrics.best_month.month) : 'No completions yet'}
          />
        </div>
      )}
    </div>
  )
}
