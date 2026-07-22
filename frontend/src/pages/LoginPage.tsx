import { Link } from 'react-router-dom'

import { ThemeToggle } from '@/components/ThemeToggle'

export function LoginPage() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm rounded-[var(--radius)] border border-border bg-surface p-8 shadow-[var(--shadow-card)]">
        <h1 className="text-2xl font-semibold tracking-tight">mustrd</h1>
        <p className="mt-1 text-sm text-muted">Your personal goals board.</p>
        <div className="mt-6 rounded-sm border border-dashed border-border p-4 text-sm text-muted">
          Sign-in form arrives in the next step.
        </div>
        <p className="mt-6 text-sm text-muted">
          New here?{' '}
          <Link to="/register" className="text-accent hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
