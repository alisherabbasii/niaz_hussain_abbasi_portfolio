import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Newspaper } from 'lucide-react';
import { fadeUp } from '../../utils/motion';
import { cn } from '../../utils/cn';
import BlogMeta from './BlogMeta';
import CategoryBadge from './CategoryBadge';

/**
 * Post preview card for a grid/list context. The whole card is clickable
 * (the title `<Link>` is stretched over it via `after:inset-0`), so it's a
 * single focus stop with the post title as its accessible name — nothing
 * else in the card is interactive.
 */
const BlogCard = ({ post, className }) => (
  <motion.article
    variants={fadeUp}
    whileHover={{ y: -4 }}
    transition={{ type: 'spring', stiffness: 280, damping: 22 }}
    className={cn('card group relative flex flex-col h-full overflow-hidden', className)}
  >
    <div className="-mx-6 -mt-6 mb-5 aspect-[16/10] overflow-hidden bg-slate-100">
      {post.coverImage ? (
        <img
          src={post.coverImage}
          alt={post.coverImageAlt || post.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/10 text-accent-strong/30">
          <Newspaper size={36} aria-hidden="true" />
        </div>
      )}
    </div>

    <div className="flex items-center justify-between gap-3 mb-4">
      <CategoryBadge category={post.category} />
      <BlogMeta post={post} show={{ readingTime: true, date: false, author: false }} />
    </div>

    <h3 className="text-xl font-bold text-primary leading-snug mb-3">
      <Link
        to={`/blog/${post.slug}`}
        className="after:absolute after:inset-0 group-hover:text-accent-strong transition-colors"
      >
        {post.title}
      </Link>
    </h3>

    <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1 line-clamp-3">{post.description}</p>

    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
      <BlogMeta post={post} show={{ author: true, date: true, readingTime: false }} />
      <span
        aria-hidden="true"
        className="flex items-center gap-1 text-accent-strong font-bold text-xs uppercase tracking-wide shrink-0 group-hover:translate-x-1 transition-transform"
      >
        Read <ArrowRight size={14} />
      </span>
    </div>
  </motion.article>
);

export default BlogCard;
