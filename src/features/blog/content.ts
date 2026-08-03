import { parseFrontmatter } from './frontmatter';
import { normalizeBlogPosts } from './schema';
import { filterPublishedPosts, sortPostsByDate } from './utils';
import type { BlogPost, BlogPostFrontmatter } from './types';

/**
 * `content/blog/*.md` is the canonical, hand-authored source of truth (see
 * `docs/BLOG-PUBLISHING-WORKFLOW.md`). Vite inlines every file's raw text at
 * build/dev time — `eager: true` means no dynamic import/network round trip,
 * matching this being a fully static site. There's still no backend or CMS:
 * a post only exists once its `.md` file is committed and the site rebuilt.
 */
const rawFiles = import.meta.glob('/content/blog/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const rawPosts: BlogPostFrontmatter[] = Object.entries(rawFiles).map(([path, raw]) => {
  const { frontmatter, content } = parseFrontmatter(raw);
  if (!frontmatter.slug) {
    // Falls back to the filename so a post authored without an explicit
    // `slug:` field still gets one consistent with its file on disk.
    const filename = path.split('/').pop() ?? '';
    frontmatter.slug = filename.replace(/\.md$/, '');
  }
  return { ...frontmatter, content } as BlogPostFrontmatter;
});

const { posts, errorsByIndex, duplicateSlugs } = normalizeBlogPosts(rawPosts);

if (Object.keys(errorsByIndex).length > 0) {
  console.error('[blog] one or more posts failed validation and were dropped:', errorsByIndex);
}
if (duplicateSlugs.length > 0) {
  console.error('[blog] duplicate post slugs found:', duplicateSlugs);
}

const allPosts = sortPostsByDate(posts);
const publishedPosts = filterPublishedPosts(allPosts);

/** Every normalized post, including drafts, newest first. */
export function getAllPosts(): BlogPost[] {
  return allPosts;
}

/** Published posts only, newest first — what the listing page and related/prev-next navigation should use. */
export function getPublishedPosts(): BlogPost[] {
  return publishedPosts;
}

/** Looks up a published post by slug. Drafts and unknown slugs both resolve to `undefined`. */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return publishedPosts.find((post) => post.slug === slug);
}

/** Looks up any normalized post (including drafts) by slug — used by the dev/admin draft preview route. */
export function getAnyPostBySlug(slug: string): BlogPost | undefined {
  return allPosts.find((post) => post.slug === slug);
}
