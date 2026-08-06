/**
 * Framework-independent blog types.
 *
 * `BlogPost` is the normalized shape the rest of the app consumes — produced
 * from a `backend/api/blog/*` response via `toDisplayPost()` (see `utils.ts`).
 */

/** Normalized blog post model. Produced only by `toDisplayPost()`. */
export interface BlogPost {
  title: string;
  slug: string;
  description: string;
  /** Sanitized HTML body, as produced by the TipTap admin editor. */
  content: string;
  /** ISO 8601 date string. */
  publishedAt: string;
  /** ISO 8601 date string, or null when the post has never been updated. */
  updatedAt: string | null;
  author: string;
  category: string;
  coverImage: string | null;
  coverImageAlt: string;
  featured: boolean;
  draft: boolean;
  keywords: string[];
  /** Whole minutes, always >= 1. */
  readingTimeMinutes: number;
}
