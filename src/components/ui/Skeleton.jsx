import { cn } from '../../utils/cn';

const VARIANT_CLASSES = {
  text: 'h-4 rounded-md',
  title: 'h-7 rounded-lg',
  circle: 'rounded-full',
  block: 'rounded-2xl',
};

/**
 * Loading placeholder. Shimmer respects prefers-reduced-motion globally
 * (see the base-layer media query in index.css). Not used anywhere yet —
 * no section currently loads async content — but establishes the pattern
 * ahead of the blog work (docs/01-WEBSITE-AUDIT-AND-ROADMAP.md §14).
 */
const Skeleton = ({ variant = 'text', width, height, className, ...props }) => (
  <span
    className={cn('skeleton block', VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.text, className)}
    style={{ width, height }}
    aria-hidden="true"
    {...props}
  />
);

export default Skeleton;
