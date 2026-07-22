import { NavLink, Outlet } from 'react-router-dom'

import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/AuthContext'
import { UnlockIndicator } from '@/features/security/UnlockIndicator'
import { cn } from '@/lib/cn'

function navClass({ isActive }: { isActive: boolean }): string {
  return cn(
    'rounded px-3 py-1.5 text-sm font-medium transition-colors',
    isActive ? 'bg-surface-2 text-content' : 'text-muted hover:text-content',
  )
}

export function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <span className="text-lg font-semibold tracking-tight">mustrd</span>
          <nav className="flex items-center gap-1">
            <NavLink to="/" className={navClass} end>
              Board
            </NavLink>
            <NavLink to="/profile" className={navClass}>
              Profile
            </NavLink>
            <NavLink to="/settings" className={navClass}>
              Settings
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {user && <span className="hidden text-sm text-muted sm:inline">{user.username}</span>}
            <UnlockIndicator />
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={logout}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
