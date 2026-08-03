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

// Local authoring aid, dev-server only — never linked from navigation. Guarding both
// the dynamic import and the route registration behind this constant lets Vite's
// production build fold the branch to `false` and drop the page from the bundle
// entirely (verified by inspecting `dist/` after a production build).
const BlogAuthor = import.meta.env.DEV ? lazy(() => import('../pages/dev/BlogAuthor')) : null;

const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="privacy-policy" element={<PrivacyPolicy />} />
        <Route path="blog" element={<BlogIndex />} />
        <Route path="blog/:slug" element={<BlogPost />} />
        {import.meta.env.DEV && <Route path="dev/blog-author" element={<BlogAuthor />} />}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
