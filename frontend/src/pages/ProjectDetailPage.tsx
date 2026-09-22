import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useConfirm } from '@/components/ConfirmProvider'
import { Plus } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { MetricsGrid } from '@/features/metrics/MetricsGrid'
import { useMetrics } from '@/features/metrics/hooks'
import { CreateProjectModal } from '@/features/projects/CreateProjectModal'
import { ProjectForm } from '@/features/projects/ProjectForm'
import { ProjectRow } from '@/features/projects/ProjectRow'
import {
  useDeleteProject,
  useProject,
  useProjects,
  useUpdateProject,
} from '@/features/projects/hooks'
import { flattenTree, pathTo, withDescendants } from '@/features/projects/tree'
import { useGoalCounts } from '@/features/projects/useGoalCounts'
import { BOARD_FILTER_STORAGE_KEY } from '@/features/projects/useProjectFilter'
import { apiErrorMessage } from '@/lib/api'
import type { Project } from '@/types'

export function ProjectDetailPage() {
  const { projectId = '' } = useParams()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const projectQuery = useProject(projectId)
  const projectsQuery = useProjects()
  const projects = projectsQuery.data ?? []
  const counts = useGoalCounts(projects)
  // Parent of the subproject being created (this project or one nested below it).
  const [creatingIn, setCreatingIn] = useState<Project | null>(null)
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

  const path = pathTo(projects, projectId)
  const parent = path.length > 1 ? path[path.length - 2] : undefined
  // This project's subtree, minus the project itself, shown indented below it.
  const subtree = (() => {
    const mine = withDescendants(projects, [projectId])
    const nodes = flattenTree(projects).filter((n) => mine.has(n.project.id))
    const base = nodes.find((n) => n.project.id === projectId)?.depth ?? 0
    return nodes
      .filter((n) => n.project.id !== projectId)
      .map((n) => ({ ...n, depth: n.depth - base - 1 }))
  })()

  async function remove(): Promise<void> {
    const where = parent ? `“${parent.name}”, with new ${parent.key} keys` : '“No project”, with new TBD keys'
    const subs = subtree.length
      ? ` Its ${subtree.length} subproject${subtree.length === 1 ? '' : 's'} move${subtree.length === 1 ? 's' : ''} up a level.`
      : ''
    const ok = await confirm({
      title: 'Delete project?',
      message: `“${project!.name}” will be deleted. Its own goals are kept and move to ${where}.${subs}`,
      confirmLabel: 'Delete project',
      danger: true,
    })
    if (ok) {
      del.mutate(projectId, {
        onSuccess: () => navigate(parent ? `/projects/${parent.id}` : '/projects'),
      })
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <Link to="/projects" className="hover:text-content">
          Projects
        </Link>
        {path.slice(0, -1).map((p) => (
          <span key={p.id} className="flex items-center gap-1.5">
            <span className="text-faint">›</span>
            <Link to={`/projects/${p.id}`} className="hover:text-content">
              {p.name}
            </Link>
          </span>
        ))}
      </nav>

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

      {project.description && <p className="-mt-5 mb-8 text-sm text-muted">{project.description}</p>}

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-semibold text-content">
          Metrics
          {subtree.length > 0 && (
            <span className="ml-2 font-normal text-faint">
              including {subtree.length} subproject{subtree.length === 1 ? '' : 's'}
            </span>
          )}
        </h2>
        {metricsQuery.isError && <p className="text-sm text-danger">Couldn’t load metrics.</p>}
        {metricsQuery.data && <MetricsGrid metrics={metricsQuery.data} />}
      </section>

      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-content">Subprojects</h2>
          <Button size="sm" variant="outline" onClick={() => setCreatingIn(project)}>
            <Plus width={14} height={14} />
            New subproject
          </Button>
        </div>
        {subtree.length === 0 ? (
          <p className="text-sm text-faint">
            None yet. Break this project down — each subproject gets its own key and goals.
          </p>
        ) : (
          <div className="space-y-3">
            {subtree.map(({ project: sub, depth }) => (
              <ProjectRow
                key={sub.id}
                project={sub}
                depth={depth}
                count={counts[sub.id] ?? { total: 0, done: 0 }}
                subprojects={withDescendants(projects, [sub.id]).size - 1}
                onAddSubproject={() => setCreatingIn(sub)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[var(--radius)] border border-border bg-surface p-6">
        <h2 className="mb-5 text-sm font-semibold text-content">Settings</h2>
        <ProjectForm
          key={project.updated_at}
          project={project}
          projects={projects}
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

      {creatingIn && (
        <CreateProjectModal
          projects={projects}
          parent={creatingIn}
          onClose={() => setCreatingIn(null)}
        />
      )}
    </div>
  )
}
