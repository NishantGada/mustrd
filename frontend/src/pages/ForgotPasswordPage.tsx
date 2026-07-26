import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { AuthCard } from '@/features/auth/AuthCard'
import { requestReset } from '@/features/password-reset/api'
import { apiErrorMessage } from '@/lib/api'

const schema = z.object({ email: z.string().email('Enter a valid email.') })
type FormValues = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (values: FormValues) => requestReset(values.email),
    onSuccess: (data) => setMessage(data.message),
    onError: (err) => setError(apiErrorMessage(err, 'Could not submit your request.')),
  })

  const onSubmit = handleSubmit((values) => {
    setError(null)
    setMessage(null)
    mutation.mutate(values)
  })

  return (
    <AuthCard
      title="Reset password"
      subtitle="An administrator reviews reset requests and will share a new password with you."
      footer={
        <Link to="/login" className="text-accent hover:underline">
          Back to sign in
        </Link>
      }
    >
      {message ? (
        <p className="rounded-sm border border-border bg-surface-2 p-4 text-sm text-content">
          {message}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...register('email')} />
          </Field>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Submitting…' : 'Request reset'}
          </Button>
        </form>
      )}
    </AuthCard>
  )
}
