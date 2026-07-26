import { NavLink, Outlet } from 'react-router-dom'

import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/lib/cn'

function navClass({ isActive }: { isActive: boolean }): string {
  return cn(
    'relative py-1 text-sm font-medium transition-colors',
    isActive
      ? "text-content after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-accent after:content-['']"
      : 'text-muted hover:text-content',
  )
}

export function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur">
        <div className="flex h-16 items-center gap-8 px-6 lg:px-10">
          <span className="text-lg font-semibold tracking-tight">mustrd</span>
          <nav className="flex items-center gap-6">
            <NavLink to="/" className={navClass} end>
              Board
            </NavLink>
            <NavLink to="/profile" className={navClass}>
              Profile
            </NavLink>
            <NavLink to="/settings" className={navClass}>
              Settings
            </NavLink>
            {user?.is_superuser && (
              <NavLink to="/admin/requests" className={navClass}>
                Requests
              </NavLink>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {user && <span className="hidden text-sm text-muted sm:inline">{user.username}</span>}
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={logout}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="w-full px-6 py-8 lg:px-10">
        <Outlet />
      </main>
    </div>
  )
}
