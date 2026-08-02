import {
  calculateReadingTimeMinutes,
  findDuplicateSlugs,
  generateExcerpt,
  generateSlug,
  isValidSlug,
  normalizeDate,
} from './utils';
import type { BlogPost, BlogPostFrontmatter, ValidationResult } from './types';

/**
 * Validates and normalizes a single raw frontmatter object into a `BlogPost`.
 *
 * Required fields: `title`, a resolvable `slug`, `content` (or its `body`
 * alias), and a parseable published date (`date`/`publishedAt`). Everything
 * else is optional and defaulted. Returns every validation error found
 * rather than stopping at the first one, so a caller can surface all of them
 * at once.
 */
export function normalizeBlogPost(raw: BlogPostFrontmatter): ValidationResult<BlogPost> {
  const errors: string[] = [];

  const title = raw.title?.trim() ?? '';
  if (!title) errors.push('title is required');

  const explicitSlug = raw.slug?.trim();
  const slug = explicitSlug || (title ? generateSlug(title) : '');
  if (!slug) {
    errors.push('slug is required (and could not be derived from title)');
  } else if (!isValidSlug(slug)) {
    errors.push(`slug "${slug}" is invalid — expected lowercase alphanumeric segments separated by hyphens`);
  }

  const content = (raw.content ?? raw.body ?? '').trim();
  if (!content) errors.push('content is required');

  const publishedAt = normalizeDate(raw.date ?? raw.publishedAt);
  if (!publishedAt) errors.push('a valid published date (date/publishedAt) is required');

  const updatedAt = normalizeDate(raw.updatedAt ?? raw.updated);

  const coverImage = raw.coverImage ?? raw.featuredImage ?? null;
  const coverImageAlt = raw.coverImageAlt?.trim() ?? '';
  if (coverImage && !coverImageAlt) {
    errors.push('coverImageAlt is required when coverImage is set');
  }

  const description = (raw.description ?? raw.excerpt ?? (content ? generateExcerpt(content) : '')).trim();
  const tags = raw.tags ?? [];
  const draft = raw.draft ?? (raw.status ? raw.status === 'draft' : false);

  if (errors.length > 0) {
    return { valid: false, errors, data: null };
  }

  const data: BlogPost = {
    title,
    slug,
    description,
    content,
    publishedAt: publishedAt as string,
    updatedAt,
    author: raw.author?.trim() ?? '',
    category: raw.category?.trim() || 'Uncategorized',
    tags,
    coverImage,
    coverImageAlt,
    featured: raw.featured ?? false,
    draft,
    keywords: raw.keywords ?? tags,
    readingTimeMinutes: calculateReadingTimeMinutes(content),
  };

  return { valid: true, errors: [], data };
}

export interface NormalizeBlogPostsResult {
  posts: BlogPost[];
  /** Validation errors for entries that failed, keyed by their index in the input array. */
  errorsByIndex: Record<number, string[]>;
  /** Slugs shared by more than one successfully normalized post. */
  duplicateSlugs: string[];
}

/**
 * Batch version of `normalizeBlogPost`. Invalid entries are dropped from
 * `posts` but reported in `errorsByIndex`; successfully normalized posts are
 * then checked against each other for duplicate slugs.
 */
export function normalizeBlogPosts(rawPosts: BlogPostFrontmatter[]): NormalizeBlogPostsResult {
  const posts: BlogPost[] = [];
  const errorsByIndex: Record<number, string[]> = {};

  rawPosts.forEach((raw, index) => {
    const result = normalizeBlogPost(raw);
    if (result.valid && result.data) {
      posts.push(result.data);
    } else {
      errorsByIndex[index] = result.errors;
    }
  });

  return { posts, errorsByIndex, duplicateSlugs: findDuplicateSlugs(posts) };
}
