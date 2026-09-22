import { cn } from '@/lib/cn'
import type { Project } from '@/types'

import { NO_PROJECT, NO_PROJECT_COLOR } from './keys'
import { flattenTree, pathTo, withDescendants } from './tree'

interface ProjectFilterProps {
  projects: Project[]
  /** Project ids and/or NO_PROJECT. Empty = all goals. */
  selected: string[]
  onChange: (next: string[]) => void
}

/** Multi-select chips in tree order: "All" clears the filter; each other chip
 *  toggles. Selecting a project includes its subprojects, whose chips then show
 *  as included. */
export function ProjectFilter({ projects, selected, onChange }: ProjectFilterProps) {
  function toggle(id: string): void {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])
  }

  const included = withDescendants(
    projects,
    selected.filter((id) => id !== NO_PROJECT),
  )

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip state={selected.length === 0 ? 'on' : 'off'} onClick={() => onChange([])}>
        All
      </Chip>
      {flattenTree(projects).map(({ project, depth }) => (
        <Chip
          key={project.id}
          state={selected.includes(project.id) ? 'on' : included.has(project.id) ? 'included' : 'off'}
          onClick={() => toggle(project.id)}
          title={pathTo(projects, project.id).map((p) => p.name).join(' › ')}
        >
          {depth > 0 && <span className="text-faint">↳</span>}
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: project.color }} />
          {project.name}
        </Chip>
      ))}
      <Chip state={selected.includes(NO_PROJECT) ? 'on' : 'off'} onClick={() => toggle(NO_PROJECT)}>
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: NO_PROJECT_COLOR }} />
        No project
      </Chip>
    </div>
  )
}

function Chip({
  state,
  onClick,
  title,
  children,
}: {
  /** 'included' = not selected itself, but shown because a parent is. */
  state: 'on' | 'included' | 'off'
  onClick: () => void
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={state === 'on'}
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors',
        state === 'on' && 'border-transparent bg-primary text-primary-content',
        state === 'included' && 'border-accent/50 bg-accent/10 text-content',
        state === 'off' && 'border-border text-muted hover:text-content',
      )}
    >
      {children}
    </button>
  )
}
