import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { Container, PageSection, Button, Input } from '../../components/ui';
import { BlogGrid, BlogEmptyState, FeaturedBlogCard, TagList } from '../../components/blog';
import { getPublishedPosts } from '../../features/blog/content';
import { filterByCategory, filterByTag, filterFeaturedPosts } from '../../features/blog/utils';
import { useSEO } from '../../utils/useSEO';
import { cn } from '../../utils/cn';

const publishedPosts = getPublishedPosts();

const CATEGORY_PILL_CLASSES =
  'px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border transition-colors';

const BlogIndex = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';
  const tag = searchParams.get('tag') ?? '';
  const hasActiveFilters = Boolean(query || category || tag);

  const categories = useMemo(
    () => [...new Set(publishedPosts.map((post) => post.category))].sort((a, b) => a.localeCompare(b)),
    []
  );
  const tags = useMemo(
    () => [...new Set(publishedPosts.flatMap((post) => post.tags))].sort((a, b) => a.localeCompare(b)),
    []
  );

  const featuredPost = useMemo(
    () => filterFeaturedPosts(publishedPosts, 1)[0] ?? publishedPosts[0] ?? null,
    []
  );

  const filteredPosts = useMemo(() => {
    let result = publishedPosts;
    if (category) result = filterByCategory(result, category);
    if (tag) result = filterByTag(result, tag);

    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (post) =>
          post.title.toLowerCase().includes(q) ||
          post.description.toLowerCase().includes(q) ||
          post.tags.some((postTag) => postTag.toLowerCase().includes(q))
      );
    }
    return result;
  }, [category, tag, query]);

  const gridPosts = hasActiveFilters
    ? filteredPosts
    : filteredPosts.filter((post) => post.slug !== featuredPost?.slug);

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

  const updateParam = (key, value) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true }
    );
  };

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
              value={query}
              onChange={(event) => updateParam('q', event.target.value)}
              placeholder="Search articles…"
            />
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => updateParam('category', '')}
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
                  key={cat}
                  type="button"
                  onClick={() => updateParam('category', category === cat ? '' : cat)}
                  aria-pressed={category === cat}
                  className={cn(
                    CATEGORY_PILL_CLASSES,
                    category === cat
                      ? 'bg-accent/10 text-accent-strong border-accent/20'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-accent/30 hover:text-accent-strong'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {tags.length > 0 && (
          <div className="mb-14 flex flex-wrap items-center gap-3">
            <TagList tags={tags} onTagClick={(t) => updateParam('tag', tag === t ? '' : t)} />
            {tag && (
              <button
                type="button"
                onClick={() => updateParam('tag', '')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent-strong hover:underline"
              >
                <X size={12} aria-hidden="true" />
                Clear tag: {tag}
              </button>
            )}
          </div>
        )}

        {!hasActiveFilters && featuredPost && (
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
            {hasActiveFilters && (
              <span className="text-sm text-slate-500 font-medium shrink-0">
                {gridPosts.length} {gridPosts.length === 1 ? 'article' : 'articles'} found
              </span>
            )}
          </div>

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
        </section>
      </Container>
    </PageSection>
  );
};

export default BlogIndex;
