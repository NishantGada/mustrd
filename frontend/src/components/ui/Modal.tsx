import type { ReactNode } from 'react'

import { X } from '@/components/icons'
import { cn } from '@/lib/cn'

type ModalSize = 'md' | 'lg'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  size?: ModalSize
}

const sizes: Record<ModalSize, string> = {
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export function Modal({ title, onClose, children, size = 'md' }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-30 grid place-items-center bg-[var(--overlay)] p-4"
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full rounded-[var(--radius)] border border-border bg-surface p-7 shadow-[var(--shadow-pop)]',
          sizes[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted transition-colors hover:text-content"
          >
            <X width={18} height={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
