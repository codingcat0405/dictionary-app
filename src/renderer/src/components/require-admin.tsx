import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'

interface RequireAdminProps {
  children: React.ReactNode
}

/**
 * Route-level admin guard for `/admin/*`.
 *
 * Reads auth state synchronously during render via `useAuth()` (backed by
 * `useSyncExternalStore`), so a logged-out or non-admin user is redirected
 * before any admin UI paints — fixes the old admin shell's `useEffect`
 * redirect, which rendered the admin UI for one frame first (and crashed
 * outright on a malformed/empty auth payload).
 *
 * IMPORTANT: this is a UX fix, not an authorization boundary. `localStorage`
 * is user-editable, so this check can be bypassed client-side. Every admin
 * API call must remain authenticated/authorized on the server independently
 * of this guard.
 */
const RequireAdmin: React.FC<RequireAdminProps> = ({ children }) => {
  const { isAdmin } = useAuth()

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default RequireAdmin
