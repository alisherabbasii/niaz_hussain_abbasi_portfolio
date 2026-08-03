import { lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SiteLayout from './layouts/SiteLayout';
import Home from '../pages/Home';

// Home ships in the main bundle (it's what every visitor lands on first),
// everything else is route-level code-split since it's only needed once a
// visitor actually navigates there.
const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy'));
const BlogIndex = lazy(() => import('../pages/blog/BlogIndex'));
const BlogPost = lazy(() => import('../pages/blog/BlogPost'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Content-drafting tool, gated by a client-side-only login (see
// src/features/admin/auth.ts) — reachable on the live site by URL, but never
// linked from navigation and marked noindex (Admin.jsx) so it doesn't surface
// in search results.
const Admin = lazy(() => import('../pages/admin/Admin'));

const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="privacy-policy" element={<PrivacyPolicy />} />
        <Route path="blog" element={<BlogIndex />} />
        <Route path="blog/:slug" element={<BlogPost />} />
        <Route path="admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
