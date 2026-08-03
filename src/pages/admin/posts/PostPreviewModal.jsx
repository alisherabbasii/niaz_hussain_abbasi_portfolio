import { Calendar, Clock, User } from 'lucide-react';
import { Modal, Badge } from '../../../components/ui';
import { CategoryBadge, TagList, MarkdownContent } from '../../../components/blog';
import { formatDate, formatReadingTime, calculateReadingTimeMinutes } from '../../../features/blog/utils';

const ARTICLE_CLASSES =
  'max-w-none text-slate-600 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-primary [&>h2]:mt-10 [&>h2]:mb-4 [&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-primary [&>h3]:mt-8 [&>h3]:mb-3 [&>p]:leading-relaxed [&>p]:mb-5 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-5 [&>ul]:space-y-1.5 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-5 [&>ol]:space-y-1.5 [&_strong]:text-primary [&_strong]:font-bold [&>p.italic]:text-slate-500';

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

      <MarkdownContent content={post.content} className={ARTICLE_CLASSES} />

      {post.tags.length > 0 && <TagList tags={post.tags} className="mt-6" />}
    </Modal>
  );
};

export default PostPreviewModal;
