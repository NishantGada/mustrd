import { cn } from '@/lib/cn'
import type { Project } from '@/types'

import { NO_PROJECT, NO_PROJECT_COLOR } from './keys'

interface ProjectFilterProps {
  projects: Project[]
  /** Project ids and/or NO_PROJECT. Empty = all goals. */
  selected: string[]
  onChange: (next: string[]) => void
}

/** Multi-select chips: "All" clears the filter; each other chip toggles. */
export function ProjectFilter({ projects, selected, onChange }: ProjectFilterProps) {
  function toggle(id: string): void {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])
  }

  const chips = [
    ...projects.map((p) => ({ id: p.id, label: p.name, color: p.color })),
    { id: NO_PROJECT, label: 'No project', color: NO_PROJECT_COLOR },
  ]

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip active={selected.length === 0} onClick={() => onChange([])}>
        All
      </Chip>
      {chips.map((chip) => (
        <Chip key={chip.id} active={selected.includes(chip.id)} onClick={() => toggle(chip.id)}>
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: chip.color }} />
          {chip.label}
        </Chip>
      ))}
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors',
        active
          ? 'border-transparent bg-primary text-primary-content'
          : 'border-border text-muted hover:text-content',
      )}
    >
      {children}
    </button>
  )
}
