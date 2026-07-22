import type { ReactNode } from 'react'

interface StatTileProps {
  label: string
  value: ReactNode
  hint?: string
}

export function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-content">{value}</p>
      {hint && <p className="mt-1 text-xs text-faint">{hint}</p>}
    </div>
  )
}
