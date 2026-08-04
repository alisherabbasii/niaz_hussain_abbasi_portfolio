import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { Container, PageSection, Button, Input, Skeleton } from '../../components/ui';
import { BlogGrid, BlogEmptyState, FeaturedBlogCard, TagList } from '../../components/blog';
import { listPosts } from '../../api/blogService';
import { listCategories } from '../../api/categoryService';
import { listTags } from '../../api/tagService';
import { toDisplayPost } from '../../features/blog/utils';
import { useSEO } from '../../utils/useSEO';
import { cn } from '../../utils/cn';

const PER_PAGE = 9;

const CATEGORY_PILL_CLASSES =
  'px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border transition-colors';

const BlogIndex = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';
  const tag = searchParams.get('tag') ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const hasActiveFilters = Boolean(query || category || tag);

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
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

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

  // Best-effort — the filter pills just stay hidden if these fail, the rest
  // of the page (search, pagination) still works.
  useEffect(() => {
    let cancelled = false;
    listCategories()
      .then((data) => {
        if (!cancelled) setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
    listTags()
      .then((data) => {
        if (!cancelled) setTags(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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
          tag: tag || undefined,
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
  }, [page, query, category, tag]);

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
        <header className="max-w-2xl mb-14">
          <p className="eyebrow mb-4">Blog</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-4 tracking-tight">
            Field Notes
          </h1>
          <p className="text-lg text-slate-500 font-light leading-relaxed">
            Write-ups on survey engineering, site supervision, and document control — practical
            lessons from active project sites across Pakistan and beyond.
          </p>
        </header>

        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full max-w-sm">
            <Input
              id="blog-search"
              label="Search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search articles…"
            />
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => updateParams({ category: '' })}
                className={cn(
                  CATEGORY_PILL_CLASSES,
                  !category
                    ? 'bg-accent/10 text-accent-strong border-accent/20'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-accent/30 hover:text-accent-strong'
                )}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => updateParams({ category: category === cat.name ? '' : cat.name })}
                  aria-pressed={category === cat.name}
                  className={cn(
                    CATEGORY_PILL_CLASSES,
                    category === cat.name
                      ? 'bg-accent/10 text-accent-strong border-accent/20'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-accent/30 hover:text-accent-strong'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {tags.length > 0 && (
          <div className="mb-14 flex flex-wrap items-center gap-3">
            <TagList
              tags={tags.map((t) => t.name)}
              onTagClick={(t) => updateParams({ tag: tag === t ? '' : t })}
            />
            {tag && (
              <button
                type="button"
                onClick={() => updateParams({ tag: '' })}
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent-strong hover:underline"
              >
                <X size={12} aria-hidden="true" />
                Clear tag: {tag}
              </button>
            )}
          </div>
        )}

        {showFeatured && (
          <section className="mb-16">
            <p className="eyebrow mb-6">Featured</p>
            <FeaturedBlogCard post={featuredPost} />
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-8 gap-4">
            <h2 className="text-2xl font-bold text-primary">
              {hasActiveFilters ? 'Results' : 'Latest Articles'}
            </h2>
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
                <div className="flex items-center justify-between mt-10">
                  <p className="text-xs font-semibold text-slate-500">
                    Page {page} of {totalPages} — {pagination.total} articles total
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
            </>
          )}
        </section>
      </Container>
    </PageSection>
  );
};

export default BlogIndex;
