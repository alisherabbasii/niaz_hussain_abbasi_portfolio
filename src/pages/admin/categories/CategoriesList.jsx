import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, AlertTriangle, CheckCircle2, FolderTree } from 'lucide-react';
import { Container, Button, Badge, Input, Skeleton } from '../../../components/ui';
import { BlogEmptyState } from '../../../components/blog';
import { listCategories, deleteCategory } from '../../../api/categoryService';
import { formatDate } from '../../../features/blog/utils';
import { isHttpError } from '../../../api/httpError';
import { useDocumentTitle } from '../../../utils/useDocumentTitle';
import { cn } from '../../../utils/cn';
import ConfirmDialog from '../posts/ConfirmDialog';

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
 * Category management: list, create, edit, delete. Every blog post belongs
 * to exactly one category (see `category_id` on `BlogPost`), so deletion is
 * blocked server-side while any post still references it — the resulting
 * 409 message is surfaced verbatim in the error banner.
 */
export default function CategoriesList() {
  useDocumentTitle('Admin — Categories');

  const [searchInput, setSearchInput] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState(null);

  const [pendingDelete, setPendingDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const fetchCategories = useCallback(() => {
    let cancelled = false;

    Promise.resolve()
      .then(() => {
        setLoading(true);
        setError('');
        return listCategories();
      })
      .then((data) => {
        if (cancelled) return;
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Could not load categories. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => fetchCategories(), [fetchCategories]);

  useEffect(() => {
    if (!banner) return undefined;
    const timeout = setTimeout(() => setBanner(null), 5000);
    return () => clearTimeout(timeout);
  }, [banner]);

  const query = searchInput.trim().toLowerCase();
  const visibleCategories = query
    ? categories.filter(
        (c) => c.name.toLowerCase().includes(query) || c.slug.toLowerCase().includes(query)
      )
    : categories;

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setBusyId(target.id);
    try {
      await deleteCategory(target.id);
      setBanner({ type: 'success', message: `Deleted "${target.name}".` });
      setPendingDelete(null);
      fetchCategories();
    } catch (err) {
      setBanner({
        type: 'error',
        message: isHttpError(err) ? err.message : `Could not delete "${target.name}".`,
      });
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
            <h1 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight mb-2">Categories</h1>
            <p className="text-slate-500 font-light">Organize blog posts into categories.</p>
          </div>
          <Button to="/admin/categories/new" icon={Plus} iconPosition="leading">
            Create category
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

        <div className="mb-6 w-full max-w-sm">
          <Input
            id="category-search"
            label="Search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name or slug…"
          />
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
        ) : visibleCategories.length === 0 ? (
          <BlogEmptyState
            icon={query ? Search : FolderTree}
            title="No categories found"
            description={
              query
                ? 'Nothing matches this search.'
                : 'Create the first category to organize blog posts.'
            }
            action={
              query ? (
                <Button variant="outline" size="sm" onClick={() => setSearchInput('')}>
                  Clear search
                </Button>
              ) : (
                <Button to="/admin/categories/new" size="sm" icon={Plus} iconPosition="leading">
                  Create category
                </Button>
              )
            }
          />
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Category Name</th>
                  <th className="px-5 py-3 hidden md:table-cell">Slug</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Created</th>
                  <th className="px-5 py-3">Blogs</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 text-slate-400 font-mono text-xs">{category.id}</td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-primary line-clamp-1">{category.name}</p>
                      <p className="text-xs text-slate-400 font-mono md:hidden">/{category.slug}</p>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell text-slate-500 font-mono text-xs">
                      /{category.slug}
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell text-slate-500">
                      {formatDate(category.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={category.post_count > 0 ? 'accent' : 'neutral'} size="sm">
                        {category.post_count}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <RowActionButton
                          label="Edit"
                          icon={Pencil}
                          to={`/admin/categories/${category.id}/edit`}
                        />
                        <RowActionButton
                          label="Delete"
                          icon={Trash2}
                          danger
                          onClick={() => setPendingDelete(category)}
                          disabled={busyId === category.id}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Container>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirm}
        title={pendingDelete ? `Delete "${pendingDelete.name}"?` : ''}
        description={
          pendingDelete?.post_count > 0
            ? 'This category is assigned to existing blog posts. Move or delete those blogs before deleting this category.'
            : "This permanently removes the category. This can't be undone."
        }
        confirmLabel="Delete"
        danger
        busy={busyId === pendingDelete?.id}
      />
    </div>
  );
}
