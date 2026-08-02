import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { fadeUp } from '../../utils/motion';

/**
 * Eyebrow + title + subtitle header block. Every homepage section currently
 * hand-rolls this exact markup (see docs/01-WEBSITE-AUDIT-AND-ROADMAP.md §10.1) —
 * new sections (and the blog) should use this instead of copy-pasting it again.
 */
const SectionHeading = ({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  animate = true,
  className,
  titleClassName,
  subtitleClassName,
}) => {
  const isCenter = align === 'center';
  const Wrapper = animate ? motion.div : 'div';
  const Eyebrow = animate ? motion.p : 'p';
  const Title = animate ? motion.h2 : 'h2';
  const Subtitle = animate ? motion.p : 'p';
  const motionProps = animate ? { variants: fadeUp } : {};

  return (
    <Wrapper className={cn(isCenter ? 'max-w-2xl mx-auto' : 'max-w-2xl', 'mb-14', className)}>
      {eyebrow && (
        <Eyebrow {...motionProps} className={cn('eyebrow mb-3', isCenter && 'text-center')}>
          {eyebrow}
        </Eyebrow>
      )}
      {title && (
        <Title {...motionProps} className={cn('section-title !mb-4', !isCenter && 'text-left', titleClassName)}>
          {title}
        </Title>
      )}
      {subtitle && (
        <Subtitle {...motionProps} className={cn('section-subtitle !mb-0', !isCenter && 'text-left mx-0', subtitleClassName)}>
          {subtitle}
        </Subtitle>
      )}
    </Wrapper>
  );
};

export default SectionHeading;
