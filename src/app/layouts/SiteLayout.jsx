import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import Navbar from '../../components/Navbar';
import Footer from '../../sections/Footer';
import { SkipToContent } from '../../components/ui';
import RouteEffects from '../RouteEffects';

const RouteFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-live="polite">
    <span className="sr-only">Loading…</span>
    <div
      className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-accent-strong animate-spin"
      aria-hidden="true"
    />
  </div>
);

/**
 * Shared chrome for every route: Navbar/Footer stay mounted across
 * navigations (only <Outlet /> content swaps), so the Suspense boundary for
 * lazy-loaded pages sits around the outlet, not around this whole layout —
 * otherwise a lazy route would flash the nav/footer away while it loads.
 */
const SiteLayout = () => (
  <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-secondary selection:bg-accent/20 selection:text-accent-dark">
      <RouteEffects />
      <SkipToContent />
      <header>
        <Navbar />
      </header>
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  </MotionConfig>
);

export default SiteLayout;
