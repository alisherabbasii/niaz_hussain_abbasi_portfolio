import { Calendar, Clock, User } from 'lucide-react';
import { Modal, Badge } from '../../../components/ui';
import { CategoryBadge, HtmlContent } from '../../../components/blog';
import { ARTICLE_PROSE_CLASSES } from '../../../components/blog/articleProseClasses';
import { formatDate, formatReadingTime, calculateReadingTimeMinutes } from '../../../features/blog/utils';

/** Read-only rendering of one post as it'll appear on the live site — same components BlogPost.jsx uses. */
const PostPreviewModal = ({ post, onClose }) => {
  if (!post) return null;

  const readingMinutes = calculateReadingTimeMinutes(post.content);

  return (
    <Modal open onClose={onClose} title={`Preview — ${post.title}`} className="max-w-3xl">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <CategoryBadge category={post.category} />
        {post.draft && <Badge variant="warning" size="sm">Draft</Badge>}
        {post.featured && <Badge variant="accent" size="sm">Featured</Badge>}
      </div>

      <h2 className="text-2xl font-extrabold text-primary mb-3 leading-snug pr-6">{post.title}</h2>

      {post.excerpt && <p className="text-slate-500 font-light leading-relaxed mb-5">{post.excerpt}</p>}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-slate-500 mb-6">
        {post.publish_date && (
          <span className="flex items-center gap-1.5">
            <Calendar size={13} aria-hidden="true" />
            {formatDate(post.publish_date)}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Clock size={13} aria-hidden="true" />
          {formatReadingTime(readingMinutes)}
        </span>
        {post.author && (
          <span className="flex items-center gap-1.5">
            <User size={13} aria-hidden="true" />
            {post.author}
          </span>
        )}
      </div>

      {post.cover_image && (
        <div className="-mx-1 mb-6 aspect-[16/9] overflow-hidden rounded-xl bg-slate-100">
          <img
            src={post.cover_image}
            alt={post.cover_image_alt ?? ''}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <HtmlContent content={post.content} className={ARTICLE_PROSE_CLASSES} />
    </Modal>
  );
};

export default PostPreviewModal;
