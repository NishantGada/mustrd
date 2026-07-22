import { useState } from 'react'

import { Button } from '@/components/ui/Button'

import { UnlockModal } from './UnlockModal'
import { useUnlock } from './useUnlock'

function formatRemaining(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function UnlockIndicator() {
  const { isUnlocked, remainingMs, lock } = useUnlock()
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      {isUnlocked ? (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted" title="Private goals unlocked">
            🔓 {formatRemaining(remainingMs)}
          </span>
          <Button variant="ghost" size="sm" onClick={() => void lock()}>
            Lock
          </Button>
        </div>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setShowModal(true)}>
          🔒 Unlock
        </Button>
      )}
      {showModal && <UnlockModal onClose={() => setShowModal(false)} />}
    </>
  )
}
