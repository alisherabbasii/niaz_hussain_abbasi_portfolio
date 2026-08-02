import { cn } from '../../utils/cn';

const TONE_CLASSES = {
  accent: 'bg-accent/10 text-accent-strong',
  success: 'bg-success/10 text-emerald-600',
  warning: 'bg-warning/10 text-amber-600',
  danger: 'bg-danger/10 text-rose-600',
  neutral: 'bg-slate-100 text-slate-600',
  dark: 'bg-primary text-white',
};

const SIZE_CLASSES = {
  sm: 'w-9 h-9 rounded-xl [&>svg]:w-4 [&>svg]:h-4',
  md: 'w-12 h-12 rounded-xl [&>svg]:w-5 [&>svg]:h-5',
  lg: 'w-14 h-14 rounded-2xl [&>svg]:w-6 [&>svg]:h-6',
};

/**
 * Colored container for a lucide-react icon — the recurring "icon in a
 * tinted rounded square" pattern from About's highlight cards, Skills'
 * category headers, and Contact's contact cards.
 */
const IconBox = ({ icon: Icon, tone = 'accent', size = 'md', shape = 'rounded', className }) => (
  <div
    className={cn(
      'inline-flex items-center justify-center shrink-0',
      TONE_CLASSES[tone] ?? TONE_CLASSES.accent,
      SIZE_CLASSES[size] ?? SIZE_CLASSES.md,
      shape === 'circle' && 'rounded-full',
      className
    )}
  >
    {Icon && <Icon aria-hidden="true" />}
  </div>
);

export default IconBox;
