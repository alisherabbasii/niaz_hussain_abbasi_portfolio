import { Link } from 'react-router-dom';
import Badge from '../ui/Badge';
import { cn } from '../../utils/cn';

/**
 * Category chip for a `BlogPost`. Renders nothing for an empty category.
 * Pass `to` (e.g. `/blog?category=Name`) to make it a clickable link to the
 * filtered blog listing — the closest thing to a category archive page
 * this site has today (see docs on category archive pages).
 */
const CategoryBadge = ({ category, to, size = 'sm', className }) => {
  if (!category) return null;

  if (to) {
    return (
      <Link to={to} className={cn('hover:opacity-80 transition-opacity', className)}>
        <Badge variant="accent" size={size}>
          {category}
        </Badge>
      </Link>
    );
  }

  return (
    <Badge variant="accent" size={size} className={className}>
      {category}
    </Badge>
  );
};

export default CategoryBadge;
