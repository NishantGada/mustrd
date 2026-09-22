import { useState } from 'react'

import { Plus } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { CreateProjectModal } from '@/features/projects/CreateProjectModal'
import { ProjectRow } from '@/features/projects/ProjectRow'
import { useProjects } from '@/features/projects/hooks'
import { flattenTree, withDescendants } from '@/features/projects/tree'
import { useGoalCounts } from '@/features/projects/useGoalCounts'
import type { Project } from '@/types'

export function ProjectsPage() {
  const projectsQuery = useProjects()
  const projects = projectsQuery.data ?? []
  const counts = useGoalCounts(projects)
  // undefined = closed, null = new top-level project, Project = new subproject of it.
  const [creating, setCreating] = useState<Project | null | undefined>(undefined)

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted">
            Group goals on your board. Projects can hold subprojects, each with its own color,
            key prefix, and metrics.
          </p>
        </div>
        <Button onClick={() => setCreating(null)}>
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

      <div className="space-y-3">
        {flattenTree(projects).map(({ project, depth }) => (
          <ProjectRow
            key={project.id}
            project={project}
            depth={depth}
            count={counts[project.id] ?? { total: 0, done: 0 }}
            subprojects={withDescendants(projects, [project.id]).size - 1}
            onAddSubproject={() => setCreating(project)}
          />
        ))}
      </div>

      {creating !== undefined && (
        <CreateProjectModal
          projects={projects}
          parent={creating ?? undefined}
          onClose={() => setCreating(undefined)}
        />
      )}
    </div>
  )
}
