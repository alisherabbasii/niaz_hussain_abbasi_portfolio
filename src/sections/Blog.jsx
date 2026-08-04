import { useEffect, useState } from 'react';
import { listPosts } from '../api/blogService';
import { toDisplayPost } from '../features/blog/utils';
import { DEFAULT_FEATURED_POSTS_LIMIT } from '../features/blog/constants';
import { BlogSection } from '../components/blog';

/**
 * Homepage teaser wrapping the presentational `BlogSection`. Fetches
 * published posts marked `featured`, falling back to the most recent
 * published posts when nothing's been curated yet. Fails (and stays empty)
 * silently — a broken teaser shouldn't put an error state on the homepage.
 */
const Blog = () => {
  const [posts, setPosts] = useState(null);

  useEffect(() => {
    let cancelled = false;
    listPosts({ featured: true, per_page: DEFAULT_FEATURED_POSTS_LIMIT })
      .then((result) =>
        result.data.length > 0
          ? result.data
          : listPosts({ per_page: DEFAULT_FEATURED_POSTS_LIMIT }).then((fallback) => fallback.data)
      )
      .then((data) => {
        if (!cancelled) setPosts(data.map(toDisplayPost));
      })
      .catch(() => {
        if (!cancelled) setPosts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!posts || posts.length === 0) return null;

  return <BlogSection posts={posts} limit={DEFAULT_FEATURED_POSTS_LIMIT} />;
};

export default Blog;
