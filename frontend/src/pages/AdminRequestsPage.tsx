import { useState } from 'react'
import { Navigate } from 'react-router-dom'

import { useConfirm } from '@/components/ConfirmProvider'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/features/auth/AuthContext'
import { useRejectRequest, useResetRequests, useResolveRequest } from '@/features/password-reset/hooks'
import { apiErrorMessage } from '@/lib/api'
import { formatDateTime } from '@/lib/dates'
import type { ResetRequest } from '@/types'

export function AdminRequestsPage() {
  const { user } = useAuth()
  const requestsQuery = useResetRequests(Boolean(user?.is_superuser))
  const [banner, setBanner] = useState<string | null>(null)

  if (user && !user.is_superuser) return <Navigate to="/" replace />

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold tracking-tight">Password reset requests</h1>
      <p className="mt-1 text-sm text-muted">
        Approve a request to set a new password, then share it with the requester directly.
      </p>

      {banner && (
        <div className="mt-4 rounded-sm border border-success/40 bg-success/10 p-3 text-sm text-content">
          {banner}
        </div>
      )}

      <div className="mt-6 space-y-3">
        {requestsQuery.isLoading && <p className="text-sm text-muted">Loading requests…</p>}
        {requestsQuery.data?.length === 0 && (
          <p className="text-sm text-faint">No pending requests.</p>
        )}
        {requestsQuery.data?.map((request) => (
          <RequestRow
            key={request.id}
            request={request}
            onResolved={(email) => setBanner(`New password set for ${email}. Share it with them now.`)}
          />
        ))}
      </div>
    </div>
  )
}

function RequestRow({
  request,
  onResolved,
}: {
  request: ResetRequest
  onResolved: (email: string) => void
}) {
  const confirm = useConfirm()
  const reject = useRejectRequest()
  const resolve = useResolveRequest()
  const [approving, setApproving] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  function save(): void {
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    resolve.mutate(
      { id: request.id, newPassword: password },
      {
        onSuccess: () => onResolved(request.user_email),
        onError: (err) => setError(apiErrorMessage(err, 'Could not set the password.')),
      },
    )
  }

  async function onReject(): Promise<void> {
    const ok = await confirm({
      title: 'Reject request?',
      message: `Dismiss the reset request from ${request.user_email}.`,
      confirmLabel: 'Reject',
      danger: true,
    })
    if (ok) reject.mutate(request.id)
  }

  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-content">{request.user_email}</p>
          <p className="text-xs text-muted">
            @{request.user_username} · requested {formatDateTime(request.created_at)}
          </p>
        </div>
        {!approving && (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setApproving(true)}>
              Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => void onReject()}>
              Reject
            </Button>
          </div>
        )}
      </div>

      {approving && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <Field label="Account" htmlFor={`email-${request.id}`}>
            <Input id={`email-${request.id}`} value={request.user_email} readOnly disabled />
          </Field>
          <Field label="New password" htmlFor={`pw-${request.id}`}>
            <Input
              id={`pw-${request.id}`}
              type="text"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </Field>
          <Field label="Confirm new password" htmlFor={`pw2-${request.id}`}>
            <Input
              id={`pw2-${request.id}`}
              type="text"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Field>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={resolve.isPending}>
              {resolve.isPending ? 'Saving…' : 'Save password'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setApproving(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
