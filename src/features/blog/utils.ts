import {
  DEFAULT_EXCERPT_LENGTH,
  DEFAULT_FEATURED_POSTS_LIMIT,
  DEFAULT_RELATED_POSTS_LIMIT,
  DEFAULT_WORDS_PER_MINUTE,
  RELATED_POST_CATEGORY_SCORE,
  RELATED_POST_TAG_SCORE,
  SLUG_PATTERN,
} from './constants';
import type { BlogPost } from './types';
import type { BlogPost as ApiBlogPost } from '../../api/types';

/**
 * Deterministically derives a URL slug from a title: lowercase, diacritics
 * stripped, anything that isn't a-z/0-9 collapsed to a single hyphen, and
 * leading/trailing hyphens trimmed. Same input always produces the same
 * output — no randomness, no timestamps.
 */
export function generateSlug(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining diacritical marks left by NFKD
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

/** Returns every slug that appears more than once, deduplicated. */
export function findDuplicateSlugs(posts: Pick<BlogPost, 'slug'>[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const post of posts) {
    if (seen.has(post.slug)) {
      duplicates.add(post.slug);
    }
    seen.add(post.slug);
  }
  return [...duplicates];
}

/** Parses a date-ish string into a normalized ISO 8601 string, or null if unparseable. */
export function normalizeDate(input: string | Date | undefined | null): string | null {
  if (!input) return null;
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

/** Formats a normalized ISO date string for display, e.g. "August 2, 2026". */
export function formatDate(
  isoDate: string,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' },
  locale = 'en-US'
): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale, options).format(date);
}

/** Strips HTML tags for use in reading-time/excerpt calculations. Not a sanitizer — see markdown.ts. */
function stripHtml(text: string): string {
  return text.replace(/<[^>]*>?/gm, '');
}

/** Word count based reading time, rounded up to the nearest whole minute (minimum 1). */
export function calculateReadingTimeMinutes(
  content: string,
  wordsPerMinute = DEFAULT_WORDS_PER_MINUTE
): number {
  const words = stripHtml(content).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 1;
  return Math.max(1, Math.ceil(words.length / wordsPerMinute));
}

export function formatReadingTime(minutes: number): string {
  return `${minutes} min read`;
}

/**
 * Derives a plain-text excerpt from body content: strips markup, collapses
 * whitespace, and truncates at the last whole word within `maxLength`,
 * appending an ellipsis if truncated.
 */
export function generateExcerpt(content: string, maxLength = DEFAULT_EXCERPT_LENGTH): string {
  const plain = stripHtml(content).replace(/\s+/g, ' ').trim();
  if (plain.length <= maxLength) return plain;

  const truncated = plain.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  const safe = lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
  return `${safe.trim()}…`;
}

export function sortPostsByDate(
  posts: BlogPost[],
  direction: 'asc' | 'desc' = 'desc'
): BlogPost[] {
  const sorted = [...posts].sort(
    (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
  );
  return direction === 'desc' ? sorted.reverse() : sorted;
}

export function filterPublishedPosts(posts: BlogPost[]): BlogPost[] {
  return posts.filter((post) => !post.draft);
}

export function filterFeaturedPosts(
  posts: BlogPost[],
  limit = DEFAULT_FEATURED_POSTS_LIMIT
): BlogPost[] {
  return filterPublishedPosts(posts)
    .filter((post) => post.featured)
    .slice(0, limit);
}

export function filterByCategory(posts: BlogPost[], category: string): BlogPost[] {
  return posts.filter((post) => post.category === category);
}

export function filterByTag(posts: BlogPost[], tag: string): BlogPost[] {
  return posts.filter((post) => post.tags.includes(tag));
}

/**
 * Scores every other published post against `post` — +{@link RELATED_POST_CATEGORY_SCORE}
 * for a matching category, +{@link RELATED_POST_TAG_SCORE} per shared tag —
 * and returns the top `limit`, highest score first, ties broken by most recent.
 * Posts scoring 0 are excluded.
 */
export function getRelatedPosts(
  post: BlogPost,
  allPosts: BlogPost[],
  limit = DEFAULT_RELATED_POSTS_LIMIT
): BlogPost[] {
  const scored = filterPublishedPosts(allPosts)
    .filter((candidate) => candidate.slug !== post.slug)
    .map((candidate) => {
      let score = 0;
      if (candidate.category === post.category) score += RELATED_POST_CATEGORY_SCORE;
      score += candidate.tags.filter((tag) => post.tags.includes(tag)).length * RELATED_POST_TAG_SCORE;
      return { candidate, score };
    })
    .filter(({ score }) => score > 0);

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.candidate.publishedAt).getTime() - new Date(a.candidate.publishedAt).getTime();
  });

  return scored.slice(0, limit).map(({ candidate }) => candidate);
}

/**
 * Adapts a `backend/api/blog/*` response (see `src/api/types.ts`) into the
 * normalized `BlogPost` shape the display components in `components/blog`
 * were built against (field names inherited from the pre-CMS static-content
 * model). `coverImage` is passed through as the root-relative path the
 * backend returns (e.g. `/uploads/blog/covers/xyz.jpg`) — same-origin in
 * production, and in local dev resolved via the Vite `/uploads` proxy (see
 * vite.config.js), matching every other `<img src={post.coverImage}>` usage
 * in `components/blog`/`pages/blog`.
 */
export function toDisplayPost(apiPost: ApiBlogPost): BlogPost {
  return {
    title: apiPost.title,
    slug: apiPost.slug,
    description: apiPost.excerpt,
    content: apiPost.content,
    publishedAt: apiPost.publish_date ?? apiPost.created_at,
    updatedAt: apiPost.updated_at !== apiPost.created_at ? apiPost.updated_at : null,
    author: apiPost.author ?? '',
    category: apiPost.category ?? '',
    tags: apiPost.tags,
    coverImage: apiPost.cover_image ?? null,
    coverImageAlt: apiPost.cover_image_alt ?? '',
    featured: apiPost.featured,
    draft: apiPost.draft,
    keywords: apiPost.tags,
    readingTimeMinutes: calculateReadingTimeMinutes(apiPost.content),
  };
}
