import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const scrollPositions = new Map();
const HASH_SCROLL_ATTEMPTS = 20;

// Route content (especially lazy-loaded pages) can still be mounting the
// frame a hash target should appear in, so retry across a few frames rather
// than giving up on the first miss.
function scrollToHash(hash, { focus }) {
  const id = decodeURIComponent(hash.slice(1));
  let attemptsLeft = HASH_SCROLL_ATTEMPTS;

  const attempt = () => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView();
      if (focus) {
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
        el.focus({ preventScroll: true });
      }
      return;
    }
    attemptsLeft -= 1;
    if (attemptsLeft > 0) requestAnimationFrame(attempt);
  };

  attempt();
}

/**
 * Single source of truth for scroll + focus behavior across route changes
 * (previously split between an App-level hash effect and Navbar's own
 * scroll-completion timer):
 * - hash present            -> scroll to and focus that element
 * - new navigation, no hash -> scroll to top, focus <main> for a11y
 * - back/forward (POP)      -> restore the scroll position the page had
 *                              when the user navigated away from it
 * The very first render (hard load/refresh) never steals focus — only
 * scrolls — so a direct link to a section doesn't yank keyboard focus away
 * from the browser chrome on initial paint.
 */
const RouteEffects = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const isFirstRender = useRef(true);

  useEffect(() => {
    window.history.scrollRestoration = 'manual';
  }, []);

  // Runs when `location` is about to change: records where the page we're
  // leaving was scrolled to, keyed by that history entry.
  useEffect(() => {
    return () => {
      scrollPositions.set(location.key, window.scrollY);
    };
  }, [location]);

  useEffect(() => {
    const shouldFocus = !isFirstRender.current;
    isFirstRender.current = false;

    if (location.hash) {
      scrollToHash(location.hash, { focus: shouldFocus });
      return;
    }

    if (navigationType === 'POP' && scrollPositions.has(location.key)) {
      window.scrollTo(0, scrollPositions.get(location.key));
      return;
    }

    window.scrollTo(0, 0);
    if (shouldFocus) {
      document.getElementById('main-content')?.focus({ preventScroll: true });
    }
  }, [location, navigationType]);

  return null;
};

export default RouteEffects;
