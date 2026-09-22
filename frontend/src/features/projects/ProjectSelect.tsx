import type { Project } from '@/types'

import { flattenTree } from './tree'

interface ProjectSelectProps {
  id: string
  projects: Project[]
  /** Project id, or '' for the empty option. */
  value: string
  onChange: (projectId: string) => void
  /** Label for the empty option. */
  emptyLabel?: string
  /** Project ids that can't be chosen (e.g. a project and its own subprojects). */
  exclude?: Set<string>
}

/** Project picker in tree order; subprojects are indented under their parent. */
export function ProjectSelect({
  id,
  projects,
  value,
  onChange,
  emptyLabel = 'No project',
  exclude,
}: ProjectSelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded border border-border bg-surface px-3 text-sm text-content focus:border-accent focus:outline-none"
    >
      <option value="">{emptyLabel}</option>
      {flattenTree(projects)
        .filter(({ project }) => !exclude?.has(project.id))
        .map(({ project, depth }) => (
          <option key={project.id} value={project.id}>
            {'   '.repeat(depth)}
            {depth > 0 ? '↳ ' : ''}
            {project.name} ({project.key})
          </option>
        ))}
    </select>
  )
}
