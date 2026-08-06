import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../../features/admin/AuthContext';
import ProtectedRoute from '../../features/admin/ProtectedRoute';
import RequirePermission from '../../features/admin/RequirePermission';
import { canManageUsers } from '../../features/admin/permissions';
import AdminLogin from './AdminLogin';
import AdminLayout from './AdminLayout';
import AdminDashboard from './AdminDashboard';
import PostList from './posts/PostList';
import PostForm from './posts/PostForm';
import CategoriesList from './categories/CategoriesList';
import CategoryForm from './categories/CategoryForm';
import UsersList from './users/UsersList';
import UserForm from './users/UserForm';
import Profile from './Profile';
import Forbidden from './Forbidden';

/**
 * `/admin/*` ships in the production build so it's reachable on the live
 * site by URL. Kept out of `robots.txt`/sitemap and marked `noindex` here so
 * it doesn't show up in search results. Auth is real: `AuthProvider` checks
 * the backend session (`GET /auth/me.php`) and `ProtectedRoute` gates
 * everything past `/admin/login` on it — see `src/features/admin/AuthContext.jsx`.
 */
export default function Admin() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="blogs" element={<PostList />} />
            <Route path="blogs/new" element={<PostForm />} />
            <Route path="blogs/:id/edit" element={<PostForm />} />
            <Route path="categories" element={<CategoriesList />} />
            <Route path="categories/new" element={<CategoryForm />} />
            <Route path="categories/:id/edit" element={<CategoryForm />} />
            <Route path="profile" element={<Profile />} />
            <Route path="forbidden" element={<Forbidden />} />
            {/* Reachable by any authenticated admin, but only super_admin passes the
                permission check — everyone else bounces to /admin/forbidden. */}
            <Route element={<RequirePermission check={canManageUsers} />}>
              <Route path="users" element={<UsersList />} />
              <Route path="users/new" element={<UserForm />} />
              <Route path="users/:id/edit" element={<UserForm />} />
            </Route>
            {/* Unknown authenticated route: back to the dashboard rather than a blank outlet. */}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
