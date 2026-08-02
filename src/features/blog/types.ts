/**
 * Framework-independent blog types.
 *
 * `BlogPostFrontmatter` is the raw shape content can arrive in (hand-authored
 * frontmatter, a legacy export, whatever). It is intentionally loose — most
 * fields are optional and several legacy aliases are accepted — because it
 * describes *input*, not a contract callers can rely on.
 *
 * `BlogPost` is the normalized shape the rest of the app should consume. It
 * has no optional fields: `normalizeBlogPost` (schema.ts) is the only
 * supported way to turn a frontmatter object into one.
 */

export type BlogDraftStatus = 'draft' | 'published';

/**
 * Raw, untrusted content shape as authored (frontmatter, a legacy JSON
 * export, etc). Field names mirror known aliases from the previous Next.js
 * content model so existing content doesn't need to be rewritten by hand.
 */
export interface BlogPostFrontmatter {
  title?: string;
  slug?: string;
  description?: string;
  /** Legacy alias for `description`. */
  excerpt?: string;
  /** Raw Markdown or pre-rendered HTML body. */
  content?: string;
  /** Legacy alias for `content`. */
  body?: string;
  /** Published date, in any string format `Date` can parse. */
  date?: string;
  /** Legacy alias for `date`. */
  publishedAt?: string;
  updatedAt?: string;
  /** Legacy alias for `updatedAt`. */
  updated?: string;
  author?: string;
  category?: string;
  tags?: string[];
  coverImage?: string;
  /** Legacy alias for `coverImage`. */
  featuredImage?: string;
  coverImageAlt?: string;
  featured?: boolean;
  draft?: boolean;
  /** Legacy alias: `status === 'draft'` maps to `draft: true`. */
  status?: BlogDraftStatus;
  keywords?: string[];
}

/** Normalized blog post model. Produced only by `normalizeBlogPost`. */
export interface BlogPost {
  title: string;
  slug: string;
  description: string;
  /** Compiled/raw body content (Markdown or sanitized HTML). */
  content: string;
  /** ISO 8601 date string. */
  publishedAt: string;
  /** ISO 8601 date string, or null when the post has never been updated. */
  updatedAt: string | null;
  author: string;
  category: string;
  tags: string[];
  coverImage: string | null;
  coverImageAlt: string;
  featured: boolean;
  draft: boolean;
  keywords: string[];
  /** Whole minutes, always >= 1. */
  readingTimeMinutes: number;
}

export interface ValidationResult<T> {
  valid: boolean;
  errors: string[];
  data: T | null;
}
