import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';

/**
 * Gate for authenticated `/admin` routes that also need a specific
 * permission (e.g. `/admin/users` — super_admin only). Sits inside
 * `ProtectedRoute` (so `admin` is already resolved) and redirects to
 * `/admin/forbidden` rather than the login screen, since the user *is*
 * authenticated — they just aren't allowed here.
 */
export default function RequirePermission({ check }) {
  const { admin } = useAuth();

  if (!check(admin)) {
    return <Navigate to="/admin/forbidden" replace />;
  }

  return <Outlet />;
}
