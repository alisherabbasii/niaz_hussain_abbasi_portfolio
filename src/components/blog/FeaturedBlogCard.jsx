import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Newspaper } from 'lucide-react';
import { fadeUp } from '../../utils/motion';
import { cn } from '../../utils/cn';
import BlogMeta from './BlogMeta';
import CategoryBadge from './CategoryBadge';

/**
 * Larger, two-column spotlight card for a single post (e.g. the newest or
 * pinned entry above a regular `BlogGrid`). Same single-link, stretched-click
 * pattern as `BlogCard`.
 */
const FeaturedBlogCard = ({ post, className }) => (
  <motion.article
    variants={fadeUp}
    whileHover={{ y: -4 }}
    transition={{ type: 'spring', stiffness: 280, damping: 22 }}
    className={cn('card group relative grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden', className)}
  >
    <div className="-mx-6 -mt-6 lg:m-0 aspect-[16/10] lg:aspect-auto lg:rounded-2xl overflow-hidden bg-slate-100">
      {post.coverImage ? (
        <img
          src={post.coverImage}
          alt={post.coverImageAlt}
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/10 text-accent-strong/30">
          <Newspaper size={48} aria-hidden="true" />
        </div>
      )}
    </div>

    <div className="flex flex-col justify-center py-2">
      <div className="mb-4">
        <CategoryBadge category={post.category} />
      </div>

      <h3 className="text-2xl md:text-3xl font-bold text-primary leading-tight mb-4">
        <Link
          to={`/blog/${post.slug}`}
          className="after:absolute after:inset-0 group-hover:text-accent-strong transition-colors"
        >
          {post.title}
        </Link>
      </h3>

      <p className="text-base text-slate-500 leading-relaxed mb-6">{post.description}</p>

      <div className="flex items-center justify-between gap-4">
        <BlogMeta post={post} />
        <span
          aria-hidden="true"
          className="flex items-center gap-1 text-accent-strong font-bold text-xs uppercase tracking-wide shrink-0 group-hover:translate-x-1 transition-transform"
        >
          Read <ArrowRight size={14} />
        </span>
      </div>
    </div>
  </motion.article>
);

export default FeaturedBlogCard;
