import type { ReactNode } from 'react'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-30 grid place-items-center bg-[var(--overlay)] px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[var(--radius)] border border-border bg-surface p-6 shadow-[var(--shadow-pop)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-content"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
