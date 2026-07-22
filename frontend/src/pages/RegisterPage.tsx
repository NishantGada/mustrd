import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { AuthCard } from '@/features/auth/AuthCard'
import { loginRequest, registerRequest, type RegisterBody } from '@/features/auth/api'
import { useAuth } from '@/features/auth/AuthContext'
import { apiErrorMessage } from '@/lib/api'

const schema = z.object({
  email: z.string().email('Enter a valid email.'),
  username: z
    .string()
    .min(3, 'At least 3 characters.')
    .max(50, 'At most 50 characters.')
    .regex(/^[A-Za-z0-9_]+$/, 'Letters, numbers, and underscores only.'),
  password: z.string().min(8, 'At least 8 characters.'),
})
type FormValues = z.infer<typeof schema>

export function RegisterPage() {
  const { status, login } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    // Register, then immediately sign in for a smooth first-run experience.
    mutationFn: async (values: RegisterBody) => {
      await registerRequest(values)
      return loginRequest({ email: values.email, password: values.password })
    },
    onSuccess: async (token) => {
      await login(token.access_token)
      navigate('/', { replace: true })
    },
    onError: (error) => setFormError(apiErrorMessage(error, 'Could not create your account.')),
  })

  if (status === 'authed') return <Navigate to="/" replace />

  const onSubmit = handleSubmit((values) => {
    setFormError(null)
    mutation.mutate(values)
  })

  return (
    <AuthCard
      title="Create your account"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field label="Username" htmlFor="username" error={errors.username?.message}>
          <Input id="username" autoComplete="username" {...register('username')} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password')}
          />
        </Field>
        {formError && <p className="text-sm text-danger">{formError}</p>}
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating…' : 'Create account'}
        </Button>
      </form>
    </AuthCard>
  )
}
