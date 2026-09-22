import type { Project } from '@/types'

interface ProjectSelectProps {
  id: string
  projects: Project[]
  /** Project id, or '' for "No project". */
  value: string
  onChange: (projectId: string) => void
}

export function ProjectSelect({ id, projects, value, onChange }: ProjectSelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded border border-border bg-surface px-3 text-sm text-content focus:border-accent focus:outline-none"
    >
      <option value="">No project</option>
      {projects.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name} ({p.key})
        </option>
      ))}
    </select>
  )
}
