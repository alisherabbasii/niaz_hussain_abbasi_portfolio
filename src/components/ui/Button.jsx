import { cn } from '../../utils/cn';

const VARIANT_CLASSES = {
  primary: 'btn-primary',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
};

const SIZE_CLASSES = {
  md: '',
  sm: 'px-5 py-2.5 text-sm',
};

/**
 * Renders an <a> when `href` is passed, otherwise a <button>. Variants map
 * onto the .btn-primary/.btn-outline/.btn-ghost classes in index.css so
 * button styling stays centralized in one place (see docs/01-WEBSITE-AUDIT-AND-ROADMAP.md §10.5).
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  href,
  icon: Icon,
  iconPosition = 'trailing',
  fullWidth = false,
  className,
  children,
  ...props
}) => {
  const classes = cn(
    VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary,
    SIZE_CLASSES[size],
    fullWidth && 'w-full',
    'group',
    className
  );

  const content = (
    <>
      {Icon && iconPosition === 'leading' && <Icon size={16} className="shrink-0" />}
      {children}
      {Icon && iconPosition === 'trailing' && <Icon size={16} className="shrink-0 transition-transform duration-200 group-hover:translate-x-1" />}
    </>
  );

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {content}
      </a>
    );
  }

  return (
    <button type={props.type ?? 'button'} className={classes} {...props}>
      {content}
    </button>
  );
};

export default Button;
