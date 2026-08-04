/** Categories currently in use. Not an enum — authors may introduce new
 * categories; this only powers a select/suggestion UI, never a hard
 * validation rejection. */
export const KNOWN_BLOG_CATEGORIES = ['Survey Engineering', 'Document Control', 'Site Safety', 'Leadership'];

export const DEFAULT_WORDS_PER_MINUTE = 200;

export const DEFAULT_EXCERPT_LENGTH = 160;

export const DEFAULT_FEATURED_POSTS_LIMIT = 3;

/** `slug` must be lowercase alphanumeric segments joined by single hyphens, e.g. "my-post-title". */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Minimum reading time (whole minutes) before an article page renders a table of contents. */
export const TOC_MIN_READING_MINUTES = 4;
