import { useAuth } from '@/features/auth/AuthContext'
import { MetricsGrid } from '@/features/metrics/MetricsGrid'
import { useMetrics } from '@/features/metrics/hooks'
import { ProjectFilter } from '@/features/projects/ProjectFilter'
import { useProjects } from '@/features/projects/hooks'
import { useProjectFilter } from '@/features/projects/useProjectFilter'

export function ProfilePage() {
  const { user } = useAuth()
  const projectsQuery = useProjects()
  const projects = projectsQuery.data ?? []
  const [selected, setSelected] = useProjectFilter()
  const { data: metrics, isLoading, isError } = useMetrics(selected)

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

      <div className="mb-5">
        <ProjectFilter projects={projects} selected={selected} onChange={setSelected} />
      </div>

      {isLoading && <p className="text-sm text-muted">Loading your metrics…</p>}
      {isError && <p className="text-sm text-danger">Couldn’t load your metrics.</p>}
      {metrics && <MetricsGrid metrics={metrics} />}
    </div>
  )
}
