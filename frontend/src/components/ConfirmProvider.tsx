import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

interface PendingState extends ConfirmOptions {
  resolve: (value: boolean) => void
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingState | null>(null)

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve })
    })
  }, [])

  function settle(value: boolean): void {
    pending?.resolve(value)
    setPending(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <Modal title={pending.title} onClose={() => settle(false)}>
          <div className="space-y-5">
            {pending.message && <p className="text-sm text-muted">{pending.message}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => settle(false)}>
                {pending.cancelLabel ?? 'Cancel'}
              </Button>
              <Button
                variant={pending.danger ? 'danger' : 'primary'}
                onClick={() => settle(true)}
                autoFocus
              >
                {pending.confirmLabel ?? 'Confirm'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}
