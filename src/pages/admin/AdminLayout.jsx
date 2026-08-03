import { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '../../components/ui';
import { useAuth } from '../../features/admin/useAuth';

const RouteFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-live="polite">
    <span className="sr-only">Loading…</span>
    <div
      className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-accent-strong animate-spin"
      aria-hidden="true"
    />
  </div>
);

/** Shared chrome for authenticated `/admin` pages: identifies the signed-in admin and owns the logout action, separate from the public `SiteLayout`. */
export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      <header className="border-b border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Admin</p>
            <p className="text-sm text-slate-600">{admin?.name} · {admin?.email}</p>
          </div>
          <Button variant="outline" size="sm" icon={LogOut} onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? 'Logging out…' : 'Log out'}
          </Button>
        </div>
      </header>
      <main>
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
