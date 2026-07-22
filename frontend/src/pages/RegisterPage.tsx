import { Link } from 'react-router-dom'

import { ThemeToggle } from '@/components/ThemeToggle'

export function RegisterPage() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm rounded-[var(--radius)] border border-border bg-surface p-8 shadow-[var(--shadow-card)]">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <div className="mt-6 rounded-sm border border-dashed border-border p-4 text-sm text-muted">
          Registration form arrives in the next step.
        </div>
        <p className="mt-6 text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
