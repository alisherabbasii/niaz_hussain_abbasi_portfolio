import Badge from '../ui/Badge';

/** Category chip for a `BlogPost`. Renders nothing for an empty category. */
const CategoryBadge = ({ category, size = 'sm', className }) => {
  if (!category) return null;

  return (
    <Badge variant="accent" size={size} className={className}>
      {category}
    </Badge>
  );
};

export default CategoryBadge;
