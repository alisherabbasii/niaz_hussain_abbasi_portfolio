import { Calendar, Clock, User } from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatDate, formatReadingTime } from '../../features/blog/utils';

/**
 * Author / publish date / reading time row for a normalized `BlogPost`.
 * Pass `show` to render only a subset (e.g. `{ author: true }` for a card
 * footer that already shows the date elsewhere).
 */
const BlogMeta = ({ post, show = {}, className }) => {
  const { date = true, readingTime = true, author = true } = show;

  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-slate-500', className)}>
      {date && post.publishedAt && (
        <span className="flex items-center gap-1.5">
          <Calendar size={13} aria-hidden="true" />
          {formatDate(post.publishedAt)}
        </span>
      )}
      {readingTime && (
        <span className="flex items-center gap-1.5">
          <Clock size={13} aria-hidden="true" />
          {formatReadingTime(post.readingTimeMinutes)}
        </span>
      )}
      {author && post.author && (
        <span className="flex items-center gap-1.5">
          <User size={13} aria-hidden="true" />
          {post.author}
        </span>
      )}
    </div>
  );
};

export default BlogMeta;
