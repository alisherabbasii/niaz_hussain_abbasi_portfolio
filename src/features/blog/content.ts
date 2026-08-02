import { BLOG_POSTS } from '../../data/blog/posts';
import { normalizeBlogPosts } from './schema';
import { filterPublishedPosts, sortPostsByDate } from './utils';
import type { BlogPost } from './types';

const { posts, errorsByIndex, duplicateSlugs } = normalizeBlogPosts(BLOG_POSTS);

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
