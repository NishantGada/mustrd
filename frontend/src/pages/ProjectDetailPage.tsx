import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useConfirm } from '@/components/ConfirmProvider'
import { Button } from '@/components/ui/Button'
import { MetricsGrid } from '@/features/metrics/MetricsGrid'
import { useMetrics } from '@/features/metrics/hooks'
import { ProjectForm } from '@/features/projects/ProjectForm'
import { useDeleteProject, useProject, useUpdateProject } from '@/features/projects/hooks'
import { BOARD_FILTER_STORAGE_KEY } from '@/features/projects/useProjectFilter'
import { apiErrorMessage } from '@/lib/api'

export function ProjectDetailPage() {
  const { projectId = '' } = useParams()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const projectQuery = useProject(projectId)
  const metricsQuery = useMetrics([projectId])
  const update = useUpdateProject(projectId)
  const del = useDeleteProject()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const project = projectQuery.data

  if (projectQuery.isLoading) return <p className="text-sm text-muted">Loading project…</p>
  if (!project) {
    return (
      <p className="text-sm text-danger">
        Project not found. <Link to="/projects" className="text-accent">Back to projects</Link>
      </p>
    )
  }

  function viewOnBoard(): void {
    localStorage.setItem(BOARD_FILTER_STORAGE_KEY, JSON.stringify([projectId]))
    navigate('/')
  }

  async function remove(): Promise<void> {
    const ok = await confirm({
      title: 'Delete project?',
      message: `“${project!.name}” will be deleted. Its goals are kept and move to “No project” with new TBD keys.`,
      confirmLabel: 'Delete project',
      danger: true,
    })
    if (ok) del.mutate(projectId, { onSuccess: () => navigate('/projects') })
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/projects" className="text-sm text-muted hover:text-content">
        ← Projects
      </Link>

      <div className="mb-8 mt-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="h-4 w-4 rounded-full" style={{ background: project.color }} />
          <h1 className="text-xl font-semibold tracking-tight">{project.name}</h1>
          <span className="font-mono text-sm tracking-wide text-faint">{project.key}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={viewOnBoard}>
            View on board
          </Button>
          <Button variant="danger" onClick={() => void remove()}>
            Delete
          </Button>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-semibold text-content">Metrics</h2>
        {metricsQuery.isError && <p className="text-sm text-danger">Couldn’t load metrics.</p>}
        {metricsQuery.data && <MetricsGrid metrics={metricsQuery.data} />}
      </section>

      <section className="rounded-[var(--radius)] border border-border bg-surface p-6">
        <h2 className="mb-5 text-sm font-semibold text-content">Settings</h2>
        <ProjectForm
          key={project.updated_at}
          project={project}
          submitLabel="Save changes"
          pending={update.isPending}
          error={error}
          onSubmit={(body) => {
            setError(null)
            setSaved(false)
            update.mutate(body, {
              onSuccess: () => setSaved(true),
              onError: (err) => setError(apiErrorMessage(err, 'Could not save the project.')),
            })
          }}
        />
        {saved && <p className="mt-3 text-sm text-success">Saved.</p>}
      </section>
    </div>
  )
}
