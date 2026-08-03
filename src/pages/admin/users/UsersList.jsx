import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Pencil,
  KeyRound,
  Ban,
  CheckCircle2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Users as UsersIcon,
} from 'lucide-react';
import { Container, Button, Badge, Input, Skeleton } from '../../../components/ui';
import { BlogEmptyState } from '../../../components/blog';
import { listUsers, updateUser, deleteUser } from '../../../api/userService';
import { formatDate } from '../../../features/blog/utils';
import { useAuth } from '../../../features/admin/useAuth';
import { ROLE_LABELS, canActOnTarget } from '../../../features/admin/permissions';
import { useDocumentTitle } from '../../../utils/useDocumentTitle';
import { cn } from '../../../utils/cn';
import ConfirmDialog from '../posts/ConfirmDialog';
import ResetPasswordDialog from './ResetPasswordDialog';

const PER_PAGE = 10;

const ROLE_FILTERS = [
  { value: '', label: 'All roles' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
];

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const PILL_CLASSES =
  'px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border transition-colors';

function pillClasses(active) {
  return cn(
    PILL_CLASSES,
    active
      ? 'bg-accent/10 text-accent-strong border-accent/20'
      : 'bg-white text-slate-500 border-slate-200 hover:border-accent/30 hover:text-accent-strong'
  );
}

const ROLE_BADGE_VARIANT = {
  super_admin: 'accent',
  admin: 'outline',
  editor: 'neutral',
};

const RowActionButton = ({ label, icon: Icon, onClick, to, danger, disabled }) => {
  const classes = cn(
    'inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none',
    danger ? 'text-rose-600 hover:bg-danger/10' : 'text-slate-500 hover:bg-slate-100 hover:text-primary'
  );

  if (to && !disabled) {
    return (
      <Link to={to} className={classes} aria-label={label} title={label}>
        <Icon size={15} aria-hidden="true" />
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={classes} aria-label={label} title={label}>
      <Icon size={15} aria-hidden="true" />
    </button>
  );
};

/**
 * Admin user management: search + role/status filters + pagination, all
 * mirrored into the URL (same pattern as `posts/PostList.jsx`). Only ever
 * reached by a super_admin — gated by `RequirePermission` in the router —
 * but every write still goes through the real API, which re-checks role and
 * the safety rules (self-delete, last active super admin, etc.) itself.
 */
export default function UsersList() {
  useDocumentTitle('Admin — Users');

  const { admin: currentAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const role = searchParams.get('role') ?? '';
  const status = searchParams.get('status') ?? '';
  const query = searchParams.get('q') ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);

  const [searchInput, setSearchInput] = useState(query);
  const [syncedQuery, setSyncedQuery] = useState(query);
  if (query !== syncedQuery) {
    setSyncedQuery(query);
    setSearchInput(query);
  }

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState(null);

  const [pendingDelete, setPendingDelete] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const updateParams = useCallback(
    (patch, { resetPage = true } = {}) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(patch).forEach(([key, value]) => {
            if (value) next.set(key, value);
            else next.delete(key);
          });
          if (resetPage) next.delete('page');
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  useEffect(() => {
    if (searchInput === query) return undefined;
    const timeout = setTimeout(() => updateParams({ q: searchInput || '' }), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const fetchUsers = useCallback(() => {
    let cancelled = false;

    Promise.resolve()
      .then(() => {
        setLoading(true);
        setError('');
        return listUsers({
          page,
          per_page: PER_PAGE,
          search: query || undefined,
          role: role || undefined,
          status: status || undefined,
        });
      })
      .then((result) => {
        if (cancelled) return;
        setUsers(result?.data ?? []);
        setPagination(result?.pagination ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Could not load admin users. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, query, role, status]);

  useEffect(() => fetchUsers(), [fetchUsers]);

  useEffect(() => {
    if (!banner) return undefined;
    const timeout = setTimeout(() => setBanner(null), 4500);
    return () => clearTimeout(timeout);
  }, [banner]);

  const totalPages = pagination?.total_pages ?? 0;
  const total = pagination?.total ?? 0;
  const hasActiveFilters = Boolean(query || role || status);

  const goToPage = (nextPage) => updateParams({ page: String(nextPage) }, { resetPage: false });

  const handleToggleActive = async (user) => {
    setBusyId(user.id);
    try {
      await updateUser(user.id, { is_active: !user.is_active });
      setBanner({ type: 'success', message: `${user.full_name} is now ${user.is_active ? 'inactive' : 'active'}.` });
      fetchUsers();
    } catch (err) {
      setBanner({ type: 'error', message: err?.message || `Could not update "${user.full_name}".` });
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setBusyId(target.id);
    try {
      await deleteUser(target.id);
      setBanner({ type: 'success', message: `Deleted "${target.full_name}".` });
      setPendingDelete(null);
      if (users.length === 1 && page > 1) {
        updateParams({ page: String(page - 1) }, { resetPage: false });
      } else {
        fetchUsers();
      }
    } catch (err) {
      setBanner({ type: 'error', message: err?.message || `Could not delete "${target.full_name}".` });
      setPendingDelete(null);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="py-8 md:py-10">
      <Container className="max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight mb-2">Users</h1>
            <p className="text-slate-500 font-light">Manage admin accounts, roles, and access.</p>
          </div>
          <Button to="/admin/users/new" icon={Plus} iconPosition="leading">
            Add user
          </Button>
        </div>

        {banner && (
          <div
            className={cn(
              'rounded-xl px-4 py-3 mb-6 text-sm font-semibold flex items-center gap-2',
              banner.type === 'success'
                ? 'bg-success/10 text-emerald-700 border border-success/20'
                : 'bg-danger/10 text-rose-700 border border-danger/20'
            )}
            role="status"
          >
            {banner.type === 'success' ? (
              <CheckCircle2 size={15} aria-hidden="true" />
            ) : (
              <AlertTriangle size={15} aria-hidden="true" />
            )}
            {banner.message}
          </div>
        )}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full max-w-sm">
            <Input
              id="user-search"
              label="Search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, username, or email…"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {ROLE_FILTERS.map((f) => (
              <button
                key={f.value || 'all-roles'}
                type="button"
                onClick={() => updateParams({ role: f.value })}
                aria-pressed={role === f.value}
                className={pillClasses(role === f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value || 'all-status'}
              type="button"
              onClick={() => updateParams({ status: f.value })}
              aria-pressed={status === f.value}
              className={pillClasses(status === f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 mb-6 flex items-center gap-3 text-sm font-semibold text-rose-700">
            <AlertTriangle size={16} className="shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="block" height={64} />
            ))}
          </div>
        ) : users.length === 0 ? (
          <BlogEmptyState
            icon={hasActiveFilters ? Search : UsersIcon}
            title="No users found"
            description={
              hasActiveFilters
                ? 'Nothing matches this search or filter combination.'
                : 'Create the first admin user to get started.'
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={() => setSearchParams({}, { replace: true })}>
                  Clear filters
                </Button>
              ) : (
                <Button to="/admin/users/new" size="sm" icon={Plus} iconPosition="leading">
                  Add user
                </Button>
              )
            }
          />
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3 hidden md:table-cell">Username</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Last login</th>
                  <th className="px-5 py-3 hidden xl:table-cell">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => {
                  const isSelf = user.id === currentAdmin?.id;
                  const canAct = canActOnTarget(currentAdmin, user);
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4 max-w-[12rem]">
                        <p className="font-bold text-primary line-clamp-1">
                          {user.full_name}
                          {isSelf && <span className="ml-1.5 text-xs font-semibold text-slate-400">(you)</span>}
                        </p>
                        <p className="text-xs text-slate-400 md:hidden">@{user.username}</p>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell text-slate-500 font-mono text-xs">
                        @{user.username}
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell text-slate-500">{user.email}</td>
                      <td className="px-5 py-4">
                        <Badge variant={ROLE_BADGE_VARIANT[user.role] ?? 'neutral'} size="sm">
                          {ROLE_LABELS[user.role] ?? user.role}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={user.is_active ? 'success' : 'danger'} size="sm">
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell text-slate-500">
                        {user.last_login_at ? formatDate(user.last_login_at) : 'Never'}
                      </td>
                      <td className="px-5 py-4 hidden xl:table-cell text-slate-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <RowActionButton
                            label="Edit"
                            icon={Pencil}
                            to={`/admin/users/${user.id}/edit`}
                            disabled={!canAct}
                          />
                          <RowActionButton
                            label={isSelf ? 'Change your own password from Profile' : 'Reset password'}
                            icon={KeyRound}
                            onClick={() => setResetTarget(user)}
                            disabled={isSelf || !canAct}
                          />
                          <RowActionButton
                            label={
                              isSelf
                                ? 'You cannot deactivate your own account'
                                : user.is_active
                                  ? 'Deactivate'
                                  : 'Activate'
                            }
                            icon={user.is_active ? Ban : CheckCircle2}
                            onClick={() => handleToggleActive(user)}
                            disabled={isSelf || !canAct || busyId === user.id}
                          />
                          <RowActionButton
                            label={isSelf ? 'You cannot delete your own account' : 'Delete'}
                            icon={Trash2}
                            danger
                            onClick={() => setPendingDelete(user)}
                            disabled={isSelf || !canAct || busyId === user.id}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-xs font-semibold text-slate-500">
              Page {page} of {totalPages} — {total} {total === 1 ? 'user' : 'users'} total
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft size={13} /> Prev
              </button>
              <button
                type="button"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </Container>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirm}
        title={pendingDelete ? `Delete "${pendingDelete.full_name}"?` : ''}
        description="This permanently removes the admin account. This can't be undone. If this user has authored blog posts or uploads, deletion will be blocked — deactivate instead."
        confirmLabel="Delete"
        danger
        busy={busyId === pendingDelete?.id}
      />

      <ResetPasswordDialog
        user={resetTarget}
        onClose={() => setResetTarget(null)}
        onSuccess={(name) => {
          setResetTarget(null);
          setBanner({ type: 'success', message: `Password reset for "${name}".` });
        }}
      />
    </div>
  );
}
