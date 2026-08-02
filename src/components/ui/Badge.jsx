import { cn } from '../../utils/cn';

const VARIANT_CLASSES = {
  neutral: 'bg-slate-100 text-slate-600 border border-slate-200',
  accent: 'bg-accent/10 text-accent-strong border border-accent/20',
  success: 'bg-success/10 text-emerald-700 border border-success/20',
  warning: 'bg-warning/10 text-amber-700 border border-warning/20',
  danger: 'bg-danger/10 text-rose-700 border border-danger/20',
  outline: 'bg-white text-primary border border-slate-200',
  dark: 'bg-white/15 text-white border border-white/20 backdrop-blur-sm',
};

const SIZE_CLASSES = {
  sm: 'px-2.5 py-1 text-[10px]',
  md: 'px-3.5 py-1.5 text-xs',
};

/**
 * Small pill used for status labels, tags, and category chips (e.g. Hero's
 * "Available for new projects" pill, WorkHighlights category labels).
 */
const Badge = ({ variant = 'neutral', size = 'md', dot = false, icon: Icon, className, children, ...props }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wide',
      VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.neutral,
      SIZE_CLASSES[size],
      className
    )}
    {...props}
  >
    {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />}
    {Icon && <Icon size={12} className="shrink-0" aria-hidden="true" />}
    {children}
  </span>
);

export default Badge;
