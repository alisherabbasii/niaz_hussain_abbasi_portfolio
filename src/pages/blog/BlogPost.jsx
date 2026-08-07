import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, ChevronRight, FileText, RefreshCw } from 'lucide-react';
import { Container, PageSection, Button, Badge } from '../../components/ui';
import {
  BlogGrid,
  BlogMeta,
  CategoryBadge,
  HtmlContent,
  ShareButtons,
  TableOfContents,
} from '../../components/blog';
import { ARTICLE_PROSE_CLASSES } from '../../components/blog/articleProseClasses';
import { getPostBySlug, getRelatedPosts } from '../../api/blogService';
import { isHttpError } from '../../api/httpError';
import { formatDate, toDisplayPost } from '../../features/blog/utils';
import { TOC_MIN_READING_MINUTES } from '../../features/blog/constants';
import { useSEO } from '../../utils/useSEO';

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [previousPost, setPreviousPost] = useState(null);
  const [nextPost, setNextPost] = useState(null);

  // Reset for a new slug during render (not inside the effect below) per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  // — avoids an extra render pass from a setState-in-effect.
  const [loadedSlug, setLoadedSlug] = useState(slug);
  if (slug !== loadedSlug) {
    setLoadedSlug(slug);
    setPost(null);
    setNotFound(false);
    setLoadError(false);
    setRelatedPosts([]);
    setPreviousPost(null);
    setNextPost(null);
  }

  // show.php already returns a draft to a logged-in admin and 404s it for
  // everyone else, so there's no separate dev-only draft-preview path here
  // the way there was for the old static-markdown content model.
  const fetchPost = useCallback(() => {
    let cancelled = false;

    // Nested inside a resolved-promise `.then` (rather than called directly
    // in the effect body) so the reset isn't a synchronous setState call in
    // the effect — see react-hooks/set-state-in-effect.
    Promise.resolve()
      .then(() => {
        setNotFound(false);
        setLoadError(false);
        return getPostBySlug(slug);
      })
      .then((data) => {
        if (!cancelled) setPost(toDisplayPost(data));
      })
      .catch((err) => {
        if (cancelled) return;
        if (isHttpError(err) && err.status === 404) setNotFound(true);
        else setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => fetchPost(), [fetchPost]);

  useEffect(() => {
    let cancelled = false;

    getRelatedPosts(slug)
      .then(({ related, previous, next }) => {
        if (cancelled) return;
        setRelatedPosts(related.map(toDisplayPost));
        setPreviousPost(previous ? toDisplayPost(previous) : null);
        setNextPost(next ? toDisplayPost(next) : null);
      })
      .catch(() => {
        // Related-articles/prev-next navigation just won't show — the post itself still renders.
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const canonicalPath = `/blog/${slug}`;

  const jsonLd = useMemo(() => {
    if (!post) return null;
    const origin = window.location.origin;
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.description,
        ...(post.coverImage ? { image: [`${origin}${post.coverImage}`] } : {}),
        datePublished: post.publishedAt,
        dateModified: post.updatedAt ?? post.publishedAt,
        author: { '@type': 'Person', name: post.author || 'Niaz Hussain Abbasi' },
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${origin}${canonicalPath}` },
        ...(post.keywords.length > 0 ? { keywords: post.keywords.join(', ') } : {}),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${origin}/blog` },
          { '@type': 'ListItem', position: 3, name: post.title, item: `${origin}${canonicalPath}` },
        ],
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post]);

  useSEO({
    title: post ? post.title : notFound ? 'Post not found' : loadError ? 'Something went wrong' : 'Loading…',
    description: post ? post.description : "There's no published post at this address.",
    path: post ? canonicalPath : undefined,
    image: post?.coverImage ?? undefined,
    type: post ? 'article' : 'website',
    publishedTime: post?.publishedAt,
    modifiedTime: post?.updatedAt ?? undefined,
    author: post?.author,
    jsonLd,
  });

  if (!post && !notFound && !loadError) {
    return (
      <PageSection center>
        <div
          className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-accent-strong animate-spin"
          role="status"
          aria-label="Loading…"
        />
      </PageSection>
    );
  }

  if (loadError) {
    return (
      <PageSection center>
        <Container className="max-w-xl">
          <div className="mx-auto mb-7 w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
            <AlertTriangle size={28} aria-hidden="true" />
          </div>

          <p className="eyebrow mb-4">Blog</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary mb-4 tracking-tight">
            Could not load this article.
          </h1>
          <p className="text-base text-slate-500 font-light leading-relaxed mb-10">
            Something went wrong while fetching this post. Check your connection and try again.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={fetchPost} icon={RefreshCw}>
              Try again
            </Button>
            <Button to="/blog" variant="outline">
              Back to blog
            </Button>
          </div>
        </Container>
      </PageSection>
    );
  }

  if (!post) {
    return (
      <PageSection center>
        <Container className="max-w-xl">
          <div className="mx-auto mb-7 w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent-strong">
            <FileText size={28} aria-hidden="true" />
          </div>

          <p className="eyebrow mb-4">Blog</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary mb-4 tracking-tight">
            We couldn&rsquo;t find that story.
          </h1>
          <p className="text-base text-slate-500 font-light leading-relaxed mb-4">
            There&rsquo;s no published post at this address. It may have been moved, unpublished,
            or the link might be mistyped.
          </p>
          <Badge variant="outline" size="sm" className="mb-10 font-mono normal-case tracking-normal">
            /blog/{slug}
          </Badge>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button to="/blog" icon={ArrowRight}>
              Back to blog
            </Button>
            <Button to="/" variant="outline">
              Homepage
            </Button>
          </div>
        </Container>
      </PageSection>
    );
  }

  const showToc = post.readingTimeMinutes >= TOC_MIN_READING_MINUTES;

  return (
    <PageSection>
      <Container className="max-w-3xl">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500">
            <li>
              <Link to="/" className="hover:text-accent-strong transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight size={12} />
            </li>
            <li>
              <Link to="/blog" className="hover:text-accent-strong transition-colors">
                Blog
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight size={12} />
            </li>
            <li aria-current="page" className="text-primary line-clamp-1">
              {post.title}
            </li>
          </ol>
        </nav>

        <header className="mb-10">
          <div className="mb-5 flex items-center gap-2">
            <CategoryBadge category={post.category} to={`/blog?category=${encodeURIComponent(post.category)}`} />
            {post.draft && (
              <Badge variant="warning" size="sm">
                Draft — dev preview only, not on the live site
              </Badge>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-extrabold text-primary mb-5 leading-[1.15] tracking-tight">
            {post.title}
          </h1>

          <p className="text-lg text-slate-500 font-light leading-relaxed mb-6">{post.description}</p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <BlogMeta post={post} />
            {post.updatedAt && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <RefreshCw size={13} aria-hidden="true" />
                Updated {formatDate(post.updatedAt)}
              </span>
            )}
          </div>
        </header>

        {post.coverImage && (
          <div className="-mx-4 md:mx-0 mb-10 aspect-[16/9] overflow-hidden rounded-none md:rounded-2xl bg-slate-100">
            <img
              src={post.coverImage}
              alt={post.coverImageAlt}
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
            />
          </div>
        )}

        {showToc && <TableOfContents />}

        <HtmlContent content={post.content} className={ARTICLE_PROSE_CLASSES} />

        <ShareButtons title={post.title} slug={post.slug} description={post.description} />

        {relatedPosts.length > 0 && (
          <section className="mt-16 mb-16">
            <h2 className="text-2xl font-bold text-primary mb-8">Related Articles</h2>
            <BlogGrid posts={relatedPosts} />
          </section>
        )}

        {(previousPost || nextPost) && (
          <nav aria-label="Post navigation" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16">
            {previousPost ? (
              <Link
                to={`/blog/${previousPost.slug}`}
                className="group flex flex-col p-5 rounded-2xl border border-slate-100 hover:border-accent/30 transition-colors"
              >
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                  <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
                  Previous
                </span>
                <span className="text-sm font-bold text-primary line-clamp-2">{previousPost.title}</span>
              </Link>
            ) : (
              <div />
            )}
            {nextPost && (
              <Link
                to={`/blog/${nextPost.slug}`}
                className="group flex flex-col p-5 rounded-2xl border border-slate-100 hover:border-accent/30 transition-colors sm:text-right sm:items-end"
              >
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                  Next
                  <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </span>
                <span className="text-sm font-bold text-primary line-clamp-2">{nextPost.title}</span>
              </Link>
            )}
          </nav>
        )}

        <div className="rounded-2xl p-8 md:p-10 text-center border border-slate-100 bg-slate-50/60">
          <h2 className="text-xl md:text-2xl font-bold text-primary mb-2">Got a project in mind?</h2>
          <p className="text-sm text-slate-500 font-light mb-6 max-w-md mx-auto">
            Whether it's survey work, document control, or civil supervision — let's talk about
            what you need.
          </p>
          <Button to="/#contact" icon={ArrowRight}>
            Contact me
          </Button>
        </div>
      </Container>
    </PageSection>
  );
};

export default BlogPost;
