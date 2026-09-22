import { Link } from 'react-router-dom'

import { Plus } from '@/components/icons'
import type { Project } from '@/types'

import type { GoalCount } from './useGoalCounts'

interface ProjectRowProps {
  project: Project
  depth: number
  count: GoalCount
  subprojects: number
  onAddSubproject: () => void
}

/** One project in the tree list: indented by depth, colored left edge. */
export function ProjectRow({ project, depth, count, subprojects, onAddSubproject }: ProjectRowProps) {
  return (
    <div style={{ marginLeft: `${depth * 1.75}rem` }} className="group relative">
      <Link
        to={`/projects/${project.id}`}
        className="block rounded-[var(--radius)] border border-l-4 border-border bg-surface px-5 py-4 pr-36 shadow-[var(--shadow-card)] transition-colors hover:border-accent/40"
        style={{ borderLeftColor: project.color }}
      >
        <div className="flex items-baseline gap-3">
          <h2 className="truncate text-base font-semibold text-content">{project.name}</h2>
          <span className="font-mono text-xs tracking-wide text-faint">{project.key}</span>
        </div>
        {project.description && (
          <p className="mt-1 line-clamp-1 text-sm text-muted">{project.description}</p>
        )}
        <p className="mt-2 text-xs text-faint">
          {count.total} goal{count.total === 1 ? '' : 's'} · {count.done} done
          {subprojects > 0 && ` · ${subprojects} subproject${subprojects === 1 ? '' : 's'} included`}
        </p>
      </Link>
      <button
        type="button"
        onClick={onAddSubproject}
        className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded px-2 py-1 text-xs text-muted opacity-0 transition-opacity hover:bg-surface-2 hover:text-content focus:opacity-100 group-hover:opacity-100"
      >
        <Plus width={13} height={13} />
        Subproject
      </button>
    </div>
  )
}
