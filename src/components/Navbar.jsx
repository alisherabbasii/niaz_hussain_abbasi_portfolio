import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight } from 'lucide-react';
import { Button } from './ui';
import { cn } from '../utils/cn';
import { EASE_PREMIUM } from '../utils/motion';

const MOBILE_MENU_ID = 'mobile-nav-menu';

// Document order matters here — it drives scroll-spy (which section is
// "closest to top" wins) and the mobile menu's list order. `home` has no
// text link (the wordmark covers it) but is still tracked so scroll-spy
// resolves correctly instead of leaving the previous item highlighted while
// the hero is in view.
//
// `type: 'section'` links point at a homepage section id (scroll-spied,
// cross-page nav goes to `/#id`). `type: 'route'` links point at a real
// route and are "active" based on the current pathname instead.
const NAV_LINKS = [
  { id: 'home', label: 'Home', showInNav: false, type: 'section' },
  { id: 'about', label: 'About', showInNav: true, type: 'section' },
  { id: 'experience', label: 'Experience', showInNav: true, type: 'section' },
  { id: 'skills', label: 'Expertise', showInNav: true, type: 'section' },
  { id: 'work', label: 'Work', showInNav: true, type: 'section' },
  { id: 'personal', label: 'Personal', showInNav: true, type: 'section' },
  { id: 'blog', label: 'Blog', showInNav: true, type: 'route', to: '/blog' },
];

// Education and Certifications (src/sections/Education.jsx,
// src/sections/Certifications.jsx) render nothing until their data files
// (src/data/education.js, src/data/certifications.js) have real entries —
// add matching NAV_LINKS entries at that point, not before.

const CTA = { id: 'contact', label: "Let's Talk" };

const SECTION_IDS = NAV_LINKS.filter((link) => link.type === 'section').map((link) => link.id).concat(CTA.id);

const Navbar = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const homeHref = (id) => (isHome ? `#${id}` : `/#${id}`);

  const [isScrolled, setIsScrolled] = useState(false);
  const [activeId, setActiveId] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const toggleButtonRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    let ticking = false;
    const updateScrolled = () => {
      setIsScrolled(window.scrollY > 8);
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateScrolled);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Navbar stays mounted across route changes (only the routed page content
  // swaps), so this has to re-attach whenever the pathname changes — not
  // just once on first mount — otherwise scroll-spy silently stops working
  // the moment a visitor lands on Home via client-side navigation instead
  // of a hard page load.
  useEffect(() => {
    if (!isHome) return undefined;

    const elements = SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean);
    if (!elements.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (!visible.length) return;
        const topMost = visible.reduce((a, b) =>
          a.boundingClientRect.top <= b.boundingClientRect.top ? a : b
        );
        setActiveId(topMost.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isHome, location.pathname]);

  const closeAndRestoreFocus = useCallback(() => {
    setIsMobileMenuOpen(false);
    toggleButtonRef.current?.focus();
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Body scroll lock + Escape-to-close + focus trap while the mobile panel
  // is open; focuses the first nav item on open so keyboard users land
  // straight in the menu instead of on a now-hidden toggle button.
  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeAndRestoreFocus();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll('a[href], button:not([disabled])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const focusTimer = window.setTimeout(() => {
      panelRef.current?.querySelector('a[href], button')?.focus();
    }, 220);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [isMobileMenuOpen, closeAndRestoreFocus]);

  const visibleLinks = NAV_LINKS.filter((link) => link.showInNav);

  const isLinkActive = (link) =>
    link.type === 'route' ? location.pathname.startsWith(link.to) : isHome && activeId === link.id;

  return (
    <nav
      aria-label="Primary"
      className={cn(
        'fixed top-0 left-0 right-0 z-50 border-b transition-colors duration-300',
        isScrolled
          ? 'bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-sm'
          : 'bg-transparent border-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 h-20 flex items-center justify-between">
        <Link
          to={homeHref('home')}
          className="text-xl font-heading font-black text-primary tracking-tight shrink-0 py-2.5"
        >
          Niaz<span className="text-accent-strong">Hussain.</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <ul className="flex items-center gap-1">
            {visibleLinks.map((link) => {
              const isActive = isLinkActive(link);
              return (
                <li key={link.id}>
                  <Link
                    to={link.type === 'route' ? link.to : homeHref(link.id)}
                    aria-current={isActive ? 'true' : undefined}
                    className={cn(
                      'relative px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200',
                      isActive ? 'text-accent-strong' : 'text-slate-600 hover:text-primary'
                    )}
                  >
                    {link.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-indicator"
                        className="absolute left-3.5 right-3.5 -bottom-0.5 h-[2px] rounded-full bg-accent-strong"
                        transition={{ duration: 0.3, ease: EASE_PREMIUM }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Button to={homeHref(CTA.id)} size="sm">
            {CTA.label}
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          ref={toggleButtonRef}
          type="button"
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-primary hover:bg-slate-100 transition-colors"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
          aria-controls={MOBILE_MENU_ID}
        >
          {isMobileMenuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              key="backdrop"
              className="md:hidden fixed inset-0 top-20 bg-slate-900/20 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              aria-hidden="true"
              onClick={closeAndRestoreFocus}
            />
            <motion.div
              key="panel"
              id={MOBILE_MENU_ID}
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: EASE_PREMIUM }}
              className="md:hidden absolute top-full left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-xl"
            >
              <ul className="py-3 px-4 flex flex-col gap-1">
                {visibleLinks.map((link) => {
                  const isActive = isLinkActive(link);
                  return (
                    <li key={link.id}>
                      <Link
                        to={link.type === 'route' ? link.to : homeHref(link.id)}
                        aria-current={isActive ? 'true' : undefined}
                        className={cn(
                          'flex items-center justify-between py-3 px-4 rounded-xl font-medium transition-all text-sm',
                          isActive ? 'bg-sky-50 text-accent-strong' : 'text-slate-700 hover:bg-slate-50 hover:text-accent-strong'
                        )}
                        onClick={closeMobileMenu}
                      >
                        {link.label}
                        <ChevronRight size={15} className={isActive ? 'text-accent-strong' : 'text-slate-400'} aria-hidden="true" />
                      </Link>
                    </li>
                  );
                })}
                <li className="pt-2 pb-1">
                  <Button to={homeHref(CTA.id)} onClick={closeMobileMenu} fullWidth>
                    {CTA.label}
                  </Button>
                </li>
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
