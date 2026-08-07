import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { Container, PageSection, Button, Skeleton } from '../../components/ui';
import { BlogGrid, BlogEmptyState, FeaturedBlogCard } from '../../components/blog';
import { listPosts } from '../../api/blogService';
import { toDisplayPost } from '../../features/blog/utils';
import { useSEO } from '../../utils/useSEO';
import { cn } from '../../utils/cn';

const PER_PAGE = 9;

const BlogIndex = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const hasActiveFilters = Boolean(query || category);

  // Keeps the search box in sync when `q` changes from outside typing (e.g.
  // "Clear filters", browser back/forward) — mirrors admin PostList.jsx.
  const [searchInput, setSearchInput] = useState(query);
  const [syncedQuery, setSyncedQuery] = useState(query);
  if (query !== syncedQuery) {
    setSyncedQuery(query);
    setSearchInput(query);
  }

  const [posts, setPosts] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState('');

  const [featuredPost, setFeaturedPost] = useState(null);

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
  // the URL (not keystrokes), same pattern as admin PostList.jsx.
  useEffect(() => {
    if (searchInput === query) return undefined;
    const timeout = setTimeout(() => updateParams({ q: searchInput || '' }), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // The hero only ever sits above an unfiltered first page, so it's only
  // fetched there. Falls back to the single latest post when nothing is
  // marked featured, so the page still gets a hero.
  useEffect(() => {
    let cancelled = false;

    // Nested inside a resolved-promise `.then` (rather than called directly
    // in the effect body) so it isn't a synchronous setState call in the
    // effect — see react-hooks/set-state-in-effect.
    Promise.resolve()
      .then(() => {
        // `undefined` is a "skip fetching" sentinel, distinct from a
        // resolved `null` meaning "fetched, but there's no post at all".
        if (hasActiveFilters || page !== 1) return undefined;
        return listPosts({ featured: true, per_page: 1 }).then(
          (result) => result.data[0] ?? listPosts({ per_page: 1 }).then((r) => r.data[0] ?? null)
        );
      })
      .then((post) => {
        if (cancelled) return;
        setFeaturedPost(post ? toDisplayPost(post) : null);
      })
      .catch(() => {
        if (!cancelled) setFeaturedPost(null);
      });

    return () => {
      cancelled = true;
    };
  }, [hasActiveFilters, page]);

  const fetchPosts = useCallback(() => {
    let cancelled = false;

    Promise.resolve()
      .then(() => {
        setPosts(null);
        setError('');
        return listPosts({
          page,
          per_page: PER_PAGE,
          search: query || undefined,
          category: category || undefined,
        });
      })
      .then((result) => {
        if (cancelled) return;
        setPosts(result.data.map(toDisplayPost));
        setPagination(result.pagination);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Could not load articles. Please try again.');
      });

    return () => {
      cancelled = true;
    };
  }, [page, query, category]);

  useEffect(() => fetchPosts(), [fetchPosts]);

  const showFeatured = !hasActiveFilters && page === 1 && Boolean(featuredPost);
  const gridPosts = showFeatured
    ? (posts ?? []).filter((post) => post.slug !== featuredPost.slug)
    : (posts ?? []);

  const totalPages = pagination?.total_pages ?? 0;
  const goToPage = (nextPage) => updateParams({ page: String(nextPage) }, { resetPage: false });

  const jsonLd = useMemo(
    () => [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${window.location.origin}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${window.location.origin}/blog` },
        ],
      },
    ],
    []
  );

  useSEO({
    title: 'Blog',
    description:
      'Field notes on survey engineering, site supervision, document control, and lessons from active project sites across Pakistan.',
    path: '/blog',
    jsonLd,
  });

  const clearFilters = () => setSearchParams({}, { replace: true });

  return (
    <PageSection>
      <Container>
        <div className="mb-16 lg:mb-20 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 lg:gap-12">
          <header className="max-w-2xl">
            <p className="eyebrow mb-4">Blog</p>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold text-primary mb-5 tracking-tight leading-[1.08]">
              Field Notes
            </h1>
            <p className="text-lg text-slate-500 font-light leading-relaxed">
              Write-ups on survey engineering, site supervision, and document control — practical
              lessons from active project sites across Pakistan and beyond.
            </p>
          </header>

          <div className="relative w-full lg:w-72 lg:pt-2 shrink-0">
            <label htmlFor="blog-search" className="sr-only">
              Search articles
            </label>
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="blog-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search articles…"
              className="field-input pl-11"
            />
          </div>
        </div>

        {showFeatured && (
          <section className="mb-16 lg:mb-24">
            <p className="eyebrow mb-6">Featured</p>
            <FeaturedBlogCard post={featuredPost} />
          </section>
        )}

        <section>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 lg:mb-10">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-primary">
                {hasActiveFilters ? 'Results' : 'Latest Articles'}
              </h2>
              {category && (
                <button
                  type="button"
                  onClick={() => updateParams({ category: '' })}
                  className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-accent-strong transition-colors hover:bg-accent/15"
                >
                  {category}
                  <X size={12} aria-hidden="true" />
                  <span className="sr-only">Clear category filter</span>
                </button>
              )}
            </div>
            {hasActiveFilters && pagination && (
              <span className="text-sm text-slate-500 font-medium shrink-0">
                {pagination.total} {pagination.total === 1 ? 'article' : 'articles'} found
              </span>
            )}
          </div>

          {error ? (
            <div className="flex flex-col items-center text-center py-20 px-6 rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/50">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-5">
                <AlertTriangle size={24} aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">Could not load articles</h3>
              <p className="text-sm text-slate-500 max-w-sm mb-6">{error}</p>
              <Button onClick={fetchPosts} variant="outline" size="sm">
                Try again
              </Button>
            </div>
          ) : !posts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="block" height={280} />
              ))}
            </div>
          ) : (
            <>
              <BlogGrid
                posts={gridPosts}
                emptyState={
                  <BlogEmptyState
                    icon={Search}
                    title={hasActiveFilters ? 'No matching articles' : 'No articles yet'}
                    description={
                      hasActiveFilters
                        ? "Nothing matches this search or filter combination — try clearing it."
                        : 'Nothing has been published here yet — check back soon.'
                    }
                    action={
                      hasActiveFilters && (
                        <Button onClick={clearFilters} variant="outline" size="sm">
                          Clear filters
                        </Button>
                      )
                    }
                  />
                }
              />

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-14 pt-8 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500">
                    Page {page} of {totalPages} — {pagination.total} articles total
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => goToPage(page - 1)}
                      disabled={page <= 1}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-primary transition-all duration-200',
                        'hover:border-slate-300 hover:-translate-y-0.5 disabled:opacity-40 disabled:pointer-events-none disabled:hover:translate-y-0'
                      )}
                    >
                      <ChevronLeft size={13} /> Prev
                    </button>
                    <button
                      type="button"
                      onClick={() => goToPage(page + 1)}
                      disabled={page >= totalPages}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-primary transition-all duration-200',
                        'hover:border-slate-300 hover:-translate-y-0.5 disabled:opacity-40 disabled:pointer-events-none disabled:hover:translate-y-0'
                      )}
                    >
                      Next <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </Container>
    </PageSection>
  );
};

export default BlogIndex;
