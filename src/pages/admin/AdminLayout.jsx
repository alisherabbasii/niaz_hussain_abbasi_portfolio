import { Suspense, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  FolderTree,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  Tag,
  User,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../features/admin/useAuth';
import { cn } from '../../utils/cn';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/blogs', label: 'Blogs', icon: Newspaper, end: false },
  { label: 'Categories', icon: FolderTree, disabled: true },
  { label: 'Tags', icon: Tag, disabled: true },
  { label: 'Media', icon: ImageIcon, disabled: true },
  { label: 'Users', icon: Users, disabled: true },
  { label: 'Profile', icon: User, disabled: true },
];

const PAGE_TITLES = [
  { pattern: /^\/admin\/blogs\/new$/, title: 'New Blog Post' },
  { pattern: /^\/admin\/blogs\/[^/]+\/edit$/, title: 'Edit Blog Post' },
  { pattern: /^\/admin\/blogs$/, title: 'Blogs' },
  { pattern: /^\/admin\/?$/, title: 'Dashboard' },
];

function pageTitleFor(pathname) {
  return PAGE_TITLES.find((entry) => entry.pattern.test(pathname))?.title ?? 'Admin';
}

const RouteFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-live="polite">
    <span className="sr-only">Loading…</span>
    <div
      className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-accent-strong animate-spin"
      aria-hidden="true"
    />
  </div>
);

function initials(name) {
  if (!name) return '';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function NavItem({ item, onNavigate }) {
  const { to, label, icon: Icon, end, disabled } = item;

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 cursor-not-allowed"
        aria-disabled="true"
      >
        <Icon size={17} className="shrink-0" aria-hidden="true" />
        <span className="flex-1 text-left truncate">{label}</span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-300 bg-slate-50 rounded-full px-2 py-0.5">
          Soon
        </span>
      </button>
    );
  }

  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors',
          isActive
            ? 'bg-accent-strong/10 text-accent-strong'
            : 'text-slate-500 hover:bg-slate-100 hover:text-primary'
        )
      }
    >
      <Icon size={17} className="shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

function SidebarContent({ collapsed, onNavigate }) {
  return (
    <>
      <div className={cn('flex items-center h-16 shrink-0', collapsed ? 'justify-center px-2' : 'px-5')}>
        {collapsed ? (
          <span className="font-heading text-lg font-bold text-primary">N</span>
        ) : (
          <span className="font-heading text-lg font-bold tracking-tight text-primary">
            Niaz<span className="text-accent-strong">Hussain.</span>
          </span>
        )}
      </div>
      <nav
        className={cn('flex-1 overflow-y-auto py-2 space-y-1', collapsed ? 'px-2' : 'px-3')}
        aria-label="Admin sections"
      >
        {collapsed
          ? NAV_ITEMS.map((item) => (
              <div key={item.label} title={item.label}>
                <NavItem item={item} onNavigate={onNavigate} />
              </div>
            ))
          : NAV_ITEMS.map((item) => <NavItem key={item.label} item={item} onNavigate={onNavigate} />)}
      </nav>
      <div className={cn('border-t border-slate-100 py-3 space-y-1', collapsed ? 'px-2' : 'px-3')}>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-primary transition-colors"
          title="View website"
        >
          <ExternalLink size={17} className="shrink-0" aria-hidden="true" />
          {!collapsed && <span className="truncate">View Website</span>}
        </a>
      </div>
    </>
  );
}

/** Standalone CRM shell for authenticated `/admin` pages — sidebar navigation, top bar with page title and account controls. Deliberately separate from the public `SiteLayout`. */
export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem('admin.sidebarCollapsed') === '1';
    } catch {
      return false;
    }
  });
  const [loggingOut, setLoggingOut] = useState(false);
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Close the mobile drawer on navigation (adjusting state during render, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes,
  // instead of a setState-in-effect that would trigger an extra render pass).
  const [drawerPathname, setDrawerPathname] = useState(location.pathname);
  if (location.pathname !== drawerPathname) {
    setDrawerPathname(location.pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const menuButton = menuButtonRef.current;
    closeButtonRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      menuButton?.focus();
    };
  }, [mobileOpen]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem('admin.sidebarCollapsed', next ? '1' : '0');
      } catch {
        // localStorage unavailable (private browsing, etc.) — collapse state just won't persist.
      }
      return next;
    });
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col shrink-0 border-r border-slate-100 bg-white transition-[width] duration-200',
          collapsed ? 'w-[76px]' : 'w-64'
        )}
      >
        <SidebarContent collapsed={collapsed} />
        <div className="border-t border-slate-100 p-2">
          <button
            type="button"
            onClick={toggleCollapsed}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-100 hover:text-primary transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronsRight size={16} aria-hidden="true" />
            ) : (
              <>
                <ChevronsLeft size={16} aria-hidden="true" />
                Collapse
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            className="absolute inset-y-0 left-0 w-72 max-w-[80vw] bg-white flex flex-col shadow-xl"
          >
            <div className="flex items-center justify-between h-16 shrink-0 px-4 border-b border-slate-100">
              <span className="font-heading text-lg font-bold tracking-tight text-primary">
                Niaz<span className="text-accent-strong">Hussain.</span>
              </span>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Close navigation"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1" aria-label="Admin sections">
              {NAV_ITEMS.map((item) => (
                <NavItem key={item.label} item={item} onNavigate={() => setMobileOpen(false)} />
              ))}
            </nav>
            <div className="border-t border-slate-100 p-3">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-primary transition-colors"
              >
                <ExternalLink size={17} className="shrink-0" aria-hidden="true" />
                View Website
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 shrink-0 border-b border-slate-100 bg-white flex items-center gap-4 px-4 lg:px-6">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Open navigation"
          >
            <Menu size={20} aria-hidden="true" />
          </button>

          <h1 className="font-heading text-lg font-bold text-primary tracking-tight truncate">
            {pageTitleFor(location.pathname)}
          </h1>

          <div className="flex-1" />

          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-sm font-bold text-primary truncate max-w-[16rem]">{admin?.name}</span>
            <span className="text-xs text-slate-400 truncate max-w-[16rem]">{admin?.email}</span>
          </div>
          <div
            className="w-9 h-9 rounded-full bg-accent-strong/10 text-accent-strong flex items-center justify-center text-xs font-bold shrink-0"
            aria-hidden="true"
          >
            {initials(admin?.name)}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-primary transition-colors disabled:opacity-50 disabled:pointer-events-none shrink-0"
          >
            <LogOut size={15} className="shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">{loggingOut ? 'Logging out…' : 'Log out'}</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
