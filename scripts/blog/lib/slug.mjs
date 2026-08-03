import { SLUG_PATTERN } from './constants.mjs';

// Matches combining marks left behind by NFKD normalization (e.g. the accent
// on "é" once it's decomposed into "e" + a combining acute accent).
const COMBINING_MARK_PATTERN = /\p{M}/gu;

/** Mirrors `generateSlug` in `src/features/blog/utils.ts` — keep the two in sync. */
export function generateSlug(title) {
  return title
    .normalize('NFKD')
    .replace(COMBINING_MARK_PATTERN, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isValidSlug(slug) {
  return SLUG_PATTERN.test(slug);
}
