import { Tag } from 'lucide-react';
import { cn } from '../../utils/cn';

const TAG_CLASSES = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold';

/**
 * Renders `tags` as a plain list by default. Pass `onTagClick` to make each
 * tag an interactive button (e.g. for filtering) — omit it to keep the list
 * inert, which is required wherever `TagList` sits inside another link's
 * click target (a card's stretched link, for example).
 */
const TagList = ({ tags, onTagClick, limit, className }) => {
  if (!tags?.length) return null;
  const visible = limit ? tags.slice(0, limit) : tags;

  return (
    <ul className={cn('flex flex-wrap gap-2', className)}>
      {visible.map((tag) => (
        <li key={tag}>
          {onTagClick ? (
            <button
              type="button"
              onClick={() => onTagClick(tag)}
              className={cn(TAG_CLASSES, 'bg-slate-100 text-slate-600 hover:bg-accent/10 hover:text-accent-strong transition-colors')}
            >
              <Tag size={11} aria-hidden="true" />
              {tag}
            </button>
          ) : (
            <span className={cn(TAG_CLASSES, 'bg-slate-100 text-slate-600')}>
              <Tag size={11} aria-hidden="true" />
              {tag}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
};

export default TagList;
