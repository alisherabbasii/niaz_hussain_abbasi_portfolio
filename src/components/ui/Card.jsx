import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const ACCENT_BORDER_CLASSES = {
  none: '',
  accent: 'border-l-4 border-l-accent',
  success: 'border-l-4 border-l-emerald-400',
  warning: 'border-l-4 border-l-amber-400',
  danger: 'border-l-4 border-l-rose-400',
};

/**
 * Wraps the shared `.card` class from index.css. Set `hover` for the
 * lift-on-hover interaction already used across About/Skills/Experience.
 */
const Card = ({ as: As = 'div', accent = 'none', hover = false, className, children, ...props }) => {
  const Comp = hover ? motion.div : As;
  const hoverProps = hover
    ? {
        whileHover: { scale: 1.02, y: -5 },
        transition: { type: 'spring', stiffness: 280, damping: 22 },
      }
    : {};

  return (
    <Comp className={cn('card', ACCENT_BORDER_CLASSES[accent], className)} {...hoverProps} {...props}>
      {children}
    </Comp>
  );
};

export default Card;
