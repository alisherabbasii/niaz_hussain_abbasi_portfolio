import { cn } from '../../utils/cn';

/**
 * Icon-only social/external link button (Footer). `label` is required and
 * renders as the accessible name — every instance must be a real, working
 * URL; see docs/01-WEBSITE-AUDIT-AND-ROADMAP.md §4.4 for why placeholder
 * hrefs are a trust problem on this site.
 */
const SocialLink = ({ href, label, icon: Icon, hoverClassName, className, ...props }) => {
  const isExternal = /^https?:\/\//.test(href);

  return (
  <a
    href={href}
    {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    aria-label={label}
    className={cn(
      'w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 transition-all duration-200',
      hoverClassName,
      className
    )}
    {...props}
  >
    <Icon size={16} aria-hidden="true" />
  </a>
  );
};

export default SocialLink;
