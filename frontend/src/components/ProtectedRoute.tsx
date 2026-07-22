import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '@/features/auth/AuthContext'

export function ProtectedRoute() {
  const { status } = useAuth()

  if (status === 'loading') {
    return <div className="grid min-h-dvh place-items-center text-muted">Loading…</div>
  }
  if (status === 'anon') {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
