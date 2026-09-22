import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Plus } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useBoardGoals } from '@/features/board/hooks'
import { ProjectForm } from '@/features/projects/ProjectForm'
import { useCreateProject, useProjects } from '@/features/projects/hooks'
import { apiErrorMessage } from '@/lib/api'

export function ProjectsPage() {
  const projectsQuery = useProjects()
  const goalsQuery = useBoardGoals()
  const [creating, setCreating] = useState(false)

  // Goal counts per project (locked goals don't reveal their project, so they're not counted).
  const counts = useMemo(() => {
    const acc: Record<string, { total: number; done: number }> = {}
    for (const g of goalsQuery.data ?? []) {
      if (!g.project_id) continue
      const entry = (acc[g.project_id] ??= { total: 0, done: 0 })
      entry.total += 1
      if (g.completed_at) entry.done += 1
    }
    return acc
  }, [goalsQuery.data])

  const projects = projectsQuery.data ?? []

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted">
            Group goals on your board. Each project has its own color, key prefix, and metrics.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus width={16} height={16} />
          New project
        </Button>
      </div>

      {projectsQuery.isLoading && <p className="text-sm text-muted">Loading projects…</p>}
      {projectsQuery.isError && <p className="text-sm text-danger">Couldn’t load your projects.</p>}

      {projectsQuery.data && projects.length === 0 && (
        <div className="rounded-[var(--radius)] border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted">No projects yet.</p>
          <p className="mt-1 text-sm text-faint">
            Try “Work”, “Personal”, or “Cooking” — goals without a project are keyed TBD-n.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const c = counts[project.id] ?? { total: 0, done: 0 }
          return (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="rounded-[var(--radius)] border border-l-4 border-border bg-surface p-5 shadow-[var(--shadow-card)] transition-colors hover:border-accent/40"
              style={{ borderLeftColor: project.color }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="truncate text-base font-semibold text-content">{project.name}</h2>
                <span className="font-mono text-xs tracking-wide text-faint">{project.key}</span>
              </div>
              {project.description && (
                <p className="mt-1.5 line-clamp-2 text-sm text-muted">{project.description}</p>
              )}
              <p className="mt-3 text-xs text-faint">
                {c.total} goal{c.total === 1 ? '' : 's'} · {c.done} done
              </p>
            </Link>
          )
        })}
      </div>

      {creating && <CreateProjectModal onClose={() => setCreating(false)} />}
    </div>
  )
}

function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const create = useCreateProject()
  const [error, setError] = useState<string | null>(null)

  return (
    <Modal title="New project" onClose={onClose} size="lg">
      <ProjectForm
        submitLabel="Create project"
        pending={create.isPending}
        error={error}
        onSubmit={(body) => {
          setError(null)
          create.mutate(body, {
            onSuccess: (project) => navigate(`/projects/${project.id}`),
            onError: (err) => setError(apiErrorMessage(err, 'Could not create the project.')),
          })
        }}
      />
    </Modal>
  )
}
