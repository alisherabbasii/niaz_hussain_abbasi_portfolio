import { Notebook } from 'lucide-react';
import { cn } from '../../utils/cn';

/** Fallback shown by `BlogGrid` when there are no posts to list. */
const BlogEmptyState = ({
  icon: Icon = Notebook,
  title = 'No articles yet',
  description = "Nothing has been published here yet — check back soon.",
  action,
  className,
}) => (
  <div
    className={cn(
      'flex flex-col items-center text-center py-20 px-6 rounded-2xl border-2 border-dashed border-slate-200 bg-white',
      className
    )}
  >
    <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent-strong flex items-center justify-center mb-5">
      <Icon size={24} aria-hidden="true" />
    </div>
    <h3 className="text-lg font-bold text-primary mb-2">{title}</h3>
    <p className="text-sm text-slate-500 max-w-sm">{description}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>
);

export default BlogEmptyState;
