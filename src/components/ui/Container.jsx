import { cn } from '../../utils/cn';

/**
 * Standard content width (max-w-7xl, matches the `section` base rule in
 * index.css) for use outside a <section> element — nav bars, footers, or
 * full-bleed section backgrounds that need an inner constrained column.
 */
const Container = ({ as: As = 'div', className, children, ...props }) => (
  <As className={cn('mx-auto w-full max-w-7xl px-4 md:px-8 lg:px-16', className)} {...props}>
    {children}
  </As>
);

export default Container;
