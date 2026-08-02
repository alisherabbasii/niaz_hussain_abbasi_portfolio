import { cn } from '../../utils/cn';

/**
 * Top-level wrapper for routed pages that don't open with a Hero (privacy
 * policy, blog, 404) and so have nothing else establishing clearance under
 * the fixed Navbar. Mirrors Hero's own pt-28/pt-32 offset and adds a
 * min-height so short pages don't leave the footer crowding the navbar.
 */
const PageSection = ({ center = false, className, children, ...props }) => (
  <section
    className={cn(
      'pt-28 pb-20 lg:pt-32 lg:pb-24 min-h-[70vh]',
      center && 'flex flex-col items-center justify-center text-center',
      className
    )}
    {...props}
  >
    {children}
  </section>
);

export default PageSection;
