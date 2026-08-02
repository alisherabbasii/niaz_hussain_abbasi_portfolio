/** Known categories from the previous content model. Not an enum — authors
 * may introduce new categories; this is only used to power a select/suggestion
 * UI, never for validation rejection. */
export const KNOWN_BLOG_CATEGORIES = [
  'Sufism',
  'Leadership',
  'Life Lessons',
  'Spiritual Thoughts',
  'Community',
];

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
