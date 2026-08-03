import { useEffect, useState } from 'react';
import { isUnlocked, lock, unlock } from '../../features/admin/auth';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

/**
 * `/admin` ships in the production build (unlike the old dev-only content
 * tool it replaces) so it's reachable on the live site by URL. Kept out of
 * `robots.txt`/sitemap and marked `noindex` here so it doesn't show up in
 * search results. See `src/features/admin/auth.ts` for why the login screen
 * in front of it is a deterrent, not real security.
 */
export default function Admin() {
  const [unlocked, setUnlocked] = useState(isUnlocked);

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const handleUnlock = () => {
    unlock();
    setUnlocked(true);
  };

  const handleLock = () => {
    lock();
    setUnlocked(false);
  };

  return unlocked ? <AdminDashboard onLock={handleLock} /> : <AdminLogin onUnlock={handleUnlock} />;
}
