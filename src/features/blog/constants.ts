/** Categories currently in use across `content/blog/*.md`. Not an enum — authors
 * may introduce new categories; this only powers a select/suggestion UI and the
 * `blog:validate` "unknown category" warning, never a hard validation rejection.
 * Keep in sync with `scripts/blog/lib/constants.mjs`. */
export const KNOWN_BLOG_CATEGORIES = ['Survey Engineering', 'Document Control', 'Site Safety', 'Leadership'];

export const DEFAULT_WORDS_PER_MINUTE = 200;

export const DEFAULT_EXCERPT_LENGTH = 160;

export const DEFAULT_RELATED_POSTS_LIMIT = 2;

export const DEFAULT_FEATURED_POSTS_LIMIT = 3;

/** Score awarded to a candidate related post that shares the source post's category. */
export const RELATED_POST_CATEGORY_SCORE = 2;

/** Score awarded per shared tag between the source post and a candidate related post. */
export const RELATED_POST_TAG_SCORE = 1;

/** `slug` must be lowercase alphanumeric segments joined by single hyphens, e.g. "my-post-title". */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Minimum reading time (whole minutes) before an article page renders a table of contents. */
export const TOC_MIN_READING_MINUTES = 4;
