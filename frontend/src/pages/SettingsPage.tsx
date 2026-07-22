import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/features/auth/AuthContext'
import { setPasscodeRequest } from '@/features/security/api'
import { apiErrorMessage } from '@/lib/api'

export function SettingsPage() {
  const { user, refresh } = useAuth()
  const hasPasscode = user?.has_security_passcode ?? false

  const [currentPasscode, setCurrentPasscode] = useState('')
  const [passcode, setPasscode] = useState('')
  const [confirmPasscode, setConfirmPasscode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: setPasscodeRequest,
    onSuccess: async () => {
      setSuccess(true)
      setCurrentPasscode('')
      setPasscode('')
      setConfirmPasscode('')
      await refresh()
    },
    onError: (err) => setError(apiErrorMessage(err, 'Could not update passcode.')),
  })

  function submit(e: React.FormEvent): void {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    if (passcode.length < 4) {
      setError('Passcode must be at least 4 characters.')
      return
    }
    if (passcode !== confirmPasscode) {
      setError('Passcodes do not match.')
      return
    }
    mutation.mutate({
      passcode,
      ...(hasPasscode ? { current_passcode: currentPasscode } : {}),
    })
  }

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>

      <div className="mt-6 rounded-[var(--radius)] border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-content">Private goal passcode</h2>
        <p className="mt-1 text-sm text-muted">
          {hasPasscode
            ? 'Change the passcode used to unlock your private goals.'
            : 'Set a passcode to start marking goals as private.'}
        </p>

        <form onSubmit={submit} className="mt-4 space-y-4">
          {hasPasscode && (
            <Field label="Current passcode" htmlFor="current-passcode">
              <Input
                id="current-passcode"
                type="password"
                value={currentPasscode}
                onChange={(e) => setCurrentPasscode(e.target.value)}
              />
            </Field>
          )}
          <Field label="New passcode" htmlFor="new-passcode">
            <Input
              id="new-passcode"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
            />
          </Field>
          <Field label="Confirm passcode" htmlFor="confirm-passcode">
            <Input
              id="confirm-passcode"
              type="password"
              value={confirmPasscode}
              onChange={(e) => setConfirmPasscode(e.target.value)}
            />
          </Field>
          {error && <p className="text-sm text-danger">{error}</p>}
          {success && <p className="text-sm text-success">Passcode updated.</p>}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : hasPasscode ? 'Update passcode' : 'Set passcode'}
          </Button>
        </form>
      </div>
    </div>
  )
}
