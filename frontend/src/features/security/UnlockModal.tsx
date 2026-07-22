import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { apiErrorMessage } from '@/lib/api'

import { useUnlock } from './useUnlock'

export function UnlockModal({ onClose }: { onClose: () => void }) {
  const { unlock } = useUnlock()
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      await unlock(passcode)
      onClose()
    } catch (err) {
      setError(apiErrorMessage(err, 'Incorrect passcode.'))
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal title="Unlock private goals" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-muted">
          Enter your passcode to reveal private goals for a little while.
        </p>
        <Input
          type="password"
          autoFocus
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Passcode"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={pending || !passcode}>
          {pending ? 'Unlocking…' : 'Unlock'}
        </Button>
      </form>
    </Modal>
  )
}
