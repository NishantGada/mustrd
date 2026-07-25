import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { apiErrorMessage } from '@/lib/api'

import { unlockRequest } from './api'

interface UnlockModalProps {
  onClose: () => void
  onUnlocked: (token: string) => void
}

export function UnlockModal({ onClose, onUnlocked }: UnlockModalProps) {
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      const { unlock_token } = await unlockRequest(passcode)
      onUnlocked(unlock_token)
    } catch (err) {
      setError(apiErrorMessage(err, 'Incorrect passcode.'))
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal title="Enter passcode" onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <p className="text-sm text-muted">This goal is private. Enter your passcode to view it.</p>
        <Input
          type="password"
          autoFocus
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Passcode"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={pending || !passcode}>
          {pending ? 'Unlocking…' : 'View goal'}
        </Button>
      </form>
    </Modal>
  )
}
