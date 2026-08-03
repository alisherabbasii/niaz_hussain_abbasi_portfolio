import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Star,
} from 'lucide-react';
import { Container, PageSection, Button, Badge, Input, Skeleton } from '../../../components/ui';
import { CategoryBadge, BlogEmptyState } from '../../../components/blog';
import { listPosts, createPost, deletePost } from '../../../api/blogService';
import { formatDate } from '../../../features/blog/utils';
import { isHttpError } from '../../../api/httpError';
import { useDocumentTitle } from '../../../utils/useDocumentTitle';
import { cn } from '../../../utils/cn';
import PostPreviewModal from './PostPreviewModal';
import ConfirmDialog from './ConfirmDialog';

const PER_PAGE = 10;

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
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

const RowActionButton = ({ label, icon: Icon, onClick, to, danger, disabled }) => {
  const classes = cn(
    'inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none',
    danger ? 'text-rose-600 hover:bg-danger/10' : 'text-slate-500 hover:bg-slate-100 hover:text-primary'
  );

  if (to) {
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

/** Appends "-copy", then "-copy-2", "-copy-3"… until a 409 stops firing (bounded — a collision on every attempt means something else is wrong). */
async function duplicatePost(post) {
  const base = `${post.slug}-copy`;
  let slug = base;
  let attempt = 1;

  while (attempt <= 5) {
    try {
      return await createPost({
        title: `${post.title} (Copy)`,
        slug,
        content: post.content,
        excerpt: post.excerpt || undefined,
        category: post.category || undefined,
        tags: post.tags,
        featured: false,
        draft: true,
      });
    } catch (error) {
      if (isHttpError(error) && error.status === 409) {
        attempt += 1;
        slug = `${base}-${attempt}`;
        continue;
      }
      throw error;
    }
  }

  throw new Error(`Could not find a free slug for "${post.title}".`);
}

/**
 * Post list: search + status/featured filters + pagination, all mirrored
 * into the URL (same pattern as `pages/blog/BlogIndex.jsx`) so a refresh
 * reproduces the exact same view. Actions call the real blog API directly —
 * no local/mock state.
 */
export default function PostList() {
  useDocumentTitle('Admin — Posts');

  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? '';
  const featuredOnly = searchParams.get('featured') === '1';
  const query = searchParams.get('q') ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);

  // Keeps the search box in sync when `q` changes from outside typing (e.g.
  // "Clear filters", browser back/forward) without a separate effect —
  // adjusting state during render, per https://react.dev/learn/you-might-not-need-an-effect.
  const [searchInput, setSearchInput] = useState(query);
  const [syncedQuery, setSyncedQuery] = useState(query);
  if (query !== syncedQuery) {
    setSyncedQuery(query);
    setSearchInput(query);
  }

  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState(null);

  const [previewPost, setPreviewPost] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
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

  // Debounce the search box into the URL — the fetch effect below reacts to
  // the URL (not keystrokes), so this is the only place debouncing happens.
  useEffect(() => {
    if (searchInput === query) return undefined;
    const timeout = setTimeout(() => updateParams({ q: searchInput || '' }), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const fetchPosts = useCallback(() => {
    let cancelled = false;

    // The initial `setLoading`/`setError` reset is nested inside this `.then`
    // (rather than called directly here) so it isn't a synchronous setState
    // call in the effect body below — see react-hooks/set-state-in-effect.
    Promise.resolve()
      .then(() => {
        setLoading(true);
        setError('');
        return listPosts({
          page,
          per_page: PER_PAGE,
          search: query || undefined,
          draft: status === 'draft' ? true : status === 'published' ? false : undefined,
          featured: featuredOnly ? true : undefined,
        });
      })
      .then((result) => {
        if (cancelled) return;
        setPosts(result?.data ?? []);
        setPagination(result?.pagination ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Could not load posts. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, query, status, featuredOnly]);

  useEffect(() => fetchPosts(), [fetchPosts]);

  useEffect(() => {
    if (!banner) return undefined;
    const timeout = setTimeout(() => setBanner(null), 4000);
    return () => clearTimeout(timeout);
  }, [banner]);

  const totalPages = pagination?.total_pages ?? 0;
  const total = pagination?.total ?? 0;
  const hasActiveFilters = Boolean(query || status || featuredOnly);

  const goToPage = (nextPage) => updateParams({ page: String(nextPage) }, { resetPage: false });

  const handleDuplicate = async (post) => {
    setBusyId(post.id);
    try {
      await duplicatePost(post);
      setBanner({ type: 'success', message: `Duplicated "${post.title}".` });
      fetchPosts();
    } catch {
      setBanner({ type: 'error', message: `Could not duplicate "${post.title}".` });
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setBusyId(target.id);
    try {
      await deletePost(target.id);
      setBanner({ type: 'success', message: `Deleted "${target.title}".` });
      setPendingDelete(null);
      if (posts.length === 1 && page > 1) {
        updateParams({ page: String(page - 1) }, { resetPage: false });
      } else {
        fetchPosts();
      }
    } catch {
      setBanner({ type: 'error', message: `Could not delete "${target.title}".` });
      setPendingDelete(null);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageSection>
      <Container className="max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight mb-2">Posts</h1>
            <p className="text-slate-500 font-light">Search, filter, and manage every post.</p>
          </div>
          <Button to="/admin/posts/new" icon={Plus} iconPosition="leading">
            Create post
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
              id="post-search"
              label="Search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search title, excerpt, or content…"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => updateParams({ status: f.value })}
                aria-pressed={status === f.value}
                className={pillClasses(status === f.value)}
              >
                {f.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => updateParams({ featured: featuredOnly ? '' : '1' })}
              aria-pressed={featuredOnly}
              className={cn(pillClasses(featuredOnly), 'inline-flex items-center gap-1.5')}
            >
              <Star size={11} aria-hidden="true" />
              Featured
            </button>
          </div>
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
        ) : posts.length === 0 ? (
          <BlogEmptyState
            icon={Search}
            title="No posts found"
            description="Nothing matches this search or filter combination."
            action={
              hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={() => setSearchParams({}, { replace: true })}>
                  Clear filters
                </Button>
              )
            }
          />
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3 hidden md:table-cell">Category</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Author</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 max-w-xs">
                      <p className="font-bold text-primary line-clamp-1">{post.title}</p>
                      <p className="text-xs text-slate-400 font-mono">/{post.slug}</p>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <CategoryBadge category={post.category} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant={post.draft ? 'warning' : 'success'} size="sm">
                          {post.draft ? 'Draft' : 'Published'}
                        </Badge>
                        {post.featured && (
                          <Badge variant="accent" size="sm" icon={Star}>
                            Featured
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell text-slate-500">{post.author ?? '—'}</td>
                    <td className="px-5 py-4 hidden lg:table-cell text-slate-500">
                      {post.publish_date ? formatDate(post.publish_date) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <RowActionButton label="Preview" icon={Eye} onClick={() => setPreviewPost(post)} />
                        <RowActionButton label="Edit" icon={Pencil} to={`/admin/posts/${post.id}/edit`} />
                        <RowActionButton
                          label="Duplicate"
                          icon={Copy}
                          onClick={() => handleDuplicate(post)}
                          disabled={busyId === post.id}
                        />
                        <RowActionButton
                          label="Delete"
                          icon={Trash2}
                          danger
                          onClick={() => setPendingDelete(post)}
                          disabled={busyId === post.id}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-xs font-semibold text-slate-500">
              Page {page} of {totalPages} — {total} {total === 1 ? 'post' : 'posts'} total
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

      {previewPost && <PostPreviewModal post={previewPost} onClose={() => setPreviewPost(null)} />}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirm}
        title={pendingDelete ? `Delete "${pendingDelete.title}"?` : ''}
        description="This permanently removes the post. This can't be undone."
        confirmLabel="Delete"
        danger
        busy={busyId === pendingDelete?.id}
      />
    </PageSection>
  );
}
