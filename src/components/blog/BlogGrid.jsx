import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { stagger, viewportOnce } from '../../utils/motion';
import BlogCard from './BlogCard';
import BlogEmptyState from './BlogEmptyState';

/**
 * Responsive grid of `BlogCard`s. Takes already-fetched, already-filtered
 * `posts` — no fetching or draft/published filtering happens in here, that's
 * the caller's job (see `features/blog/utils.js`).
 */
const BlogGrid = ({ posts = [], emptyState, className }) => {
  if (posts.length === 0) {
    return emptyState ?? <BlogEmptyState />;
  }

  return (
    <motion.div
      className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8', className)}
      variants={stagger()}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
    >
      {posts.map((post) => (
        <BlogCard key={post.slug} post={post} />
      ))}
    </motion.div>
  );
};

export default BlogGrid;
