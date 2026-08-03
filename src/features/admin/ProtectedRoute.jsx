import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

const LoadingScreen = () => (
  <div className="min-h-[70vh] flex items-center justify-center" role="status" aria-live="polite">
    <span className="sr-only">Checking session…</span>
    <div
      className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-accent-strong animate-spin"
      aria-hidden="true"
    />
  </div>
);

/** Gate for the authenticated `/admin` route tree — redirects to the login screen unless the backend session check (`AuthProvider`) confirms an active admin. */
export default function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <LoadingScreen />;

  if (status !== 'authenticated') {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
