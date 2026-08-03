import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle2, PenLine, Star, AlertTriangle, ArrowRight } from 'lucide-react';
import { Container, PageSection, Badge, Skeleton } from '../../components/ui';
import { CategoryBadge } from '../../components/blog';
import { listPosts } from '../../api/blogService';
import { formatDate } from '../../features/blog/utils';
import { useDocumentTitle } from '../../utils/useDocumentTitle';

const STAT_CARDS = [
  { key: 'total', label: 'Total posts', icon: FileText, filter: {}, tone: 'text-primary bg-slate-100' },
  { key: 'published', label: 'Published', icon: CheckCircle2, filter: { status: 'published' }, tone: 'text-emerald-700 bg-success/10' },
  { key: 'draft', label: 'Drafts', icon: PenLine, filter: { status: 'draft' }, tone: 'text-amber-700 bg-warning/10' },
  { key: 'featured', label: 'Featured', icon: Star, filter: { featured: '1' }, tone: 'text-accent-strong bg-accent/10' },
];

function filterToParams(filter) {
  const params = new URLSearchParams();
  if (filter.status) params.set('status', filter.status);
  if (filter.featured) params.set('featured', filter.featured);
  return params.toString();
}

/** Overview landing screen for `/admin`: post counts by status plus a short recent-activity list, each linking into the filtered `/admin/posts` view. */
export default function AdminDashboard() {
  useDocumentTitle('Admin — Dashboard');

  const [counts, setCounts] = useState(null);
  const [recentPosts, setRecentPosts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      listPosts({ per_page: 1 }),
      listPosts({ per_page: 1, draft: false }),
      listPosts({ per_page: 1, draft: true }),
      listPosts({ per_page: 1, featured: true }),
      listPosts({ per_page: 5 }),
    ])
      .then(([total, published, draft, featured, recent]) => {
        if (cancelled) return;
        setCounts({
          total: total.pagination.total,
          published: published.pagination.total,
          draft: draft.pagination.total,
          featured: featured.pagination.total,
        });
        setRecentPosts(recent.data);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Could not load dashboard data. Please try again.');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageSection>
      <Container className="max-w-6xl">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight mb-2">Dashboard</h1>
          <p className="text-slate-500 font-light">An overview of everything published on the blog.</p>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 mb-8 flex items-center gap-3 text-sm font-semibold text-rose-700">
            <AlertTriangle size={16} className="shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {STAT_CARDS.map((card) => (
            <Link
              key={card.key}
              to={`/admin/posts${filterToParams(card.filter) ? `?${filterToParams(card.filter)}` : ''}`}
              className="rounded-2xl border border-slate-100 bg-white p-5 hover:border-accent/30 transition-colors"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${card.tone}`}>
                <card.icon size={16} aria-hidden="true" />
              </div>
              {counts ? (
                <p className="text-2xl font-extrabold text-primary mb-1">{counts[card.key]}</p>
              ) : (
                <Skeleton variant="title" width={40} className="mb-1" />
              )}
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{card.label}</p>
            </Link>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-primary">Recent posts</h2>
            <Link
              to="/admin/posts"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-strong hover:underline"
            >
              View all <ArrowRight size={12} aria-hidden="true" />
            </Link>
          </div>

          {!recentPosts ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="block" height={56} />
              ))}
            </div>
          ) : recentPosts.length === 0 ? (
            <p className="text-sm text-slate-500">No posts yet — create the first one from the Posts tab.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentPosts.map((post) => (
                <li key={post.id}>
                  <Link
                    to={`/admin/posts/${post.id}/edit`}
                    className="flex items-center justify-between gap-4 py-3.5 group"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-primary text-sm truncate group-hover:text-accent-strong transition-colors">
                        {post.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <CategoryBadge category={post.category} size="sm" />
                        {post.publish_date && (
                          <span className="text-xs text-slate-400">{formatDate(post.publish_date)}</span>
                        )}
                      </div>
                    </div>
                    <Badge variant={post.draft ? 'warning' : 'success'} size="sm" className="shrink-0">
                      {post.draft ? 'Draft' : 'Published'}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </PageSection>
  );
}
