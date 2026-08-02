import { ArrowRight } from 'lucide-react';
import { Section, Button } from '../ui';
import { DEFAULT_FEATURED_POSTS_LIMIT } from '../../features/blog/constants';
import BlogGrid from './BlogGrid';

/**
 * Homepage "Featured Writings" teaser. `posts` must already be the curated
 * list to show (e.g. `filterFeaturedPosts(allPosts)`) — this component only
 * renders, it doesn't fetch or filter.
 */
const BlogSection = ({ posts = [], limit = DEFAULT_FEATURED_POSTS_LIMIT, className }) => (
  <Section
    id="blog"
    eyebrow="Latest Articles"
    title="Featured Writings"
    subtitle="Reflections on spiritual knowledge, life lessons, and balancing technical discipline with inner peace."
    className={className}
  >
    <BlogGrid posts={posts.slice(0, limit)} />

    <div className="flex justify-center mt-12">
      <Button to="/blog" variant="outline" icon={ArrowRight}>
        View all journals
      </Button>
    </div>
  </Section>
);

export default BlogSection;
