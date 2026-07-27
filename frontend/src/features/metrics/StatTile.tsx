import { useState, type ReactNode } from 'react'

import { Info } from '@/components/icons'

interface StatTileProps {
  label: string
  value: ReactNode
  hint?: string
  /** Longer "what it means + how it's calculated" text, shown in a "?" popover. */
  info?: string
}

export function StatTile({ label, value, hint, info }: StatTileProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        {info && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={`How ${label} is calculated`}
              className="text-faint transition-colors hover:text-content"
            >
              <Info width={14} height={14} />
            </button>
            {open && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                <div className="absolute right-0 top-6 z-20 w-60 rounded-[var(--radius-sm)] border border-border bg-surface p-3 text-left text-xs leading-relaxed text-muted shadow-[var(--shadow-pop)]">
                  {info}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-content">{value}</p>
      {hint && <p className="mt-1 text-xs text-faint">{hint}</p>}
    </div>
  )
}
