import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { stagger, viewportOnce } from '../../utils/motion';
import SectionHeading from './SectionHeading';

const TONE_CLASSES = {
  light: '',
  muted: 'bg-slate-50/60',
  dark: 'bg-primary text-white',
};

/**
 * Standard homepage section wrapper: renders a semantic <section> (which
 * already inherits max-width/padding from the base-layer `section` rule in
 * index.css), an optional animated SectionHeading, and a stagger-on-scroll
 * container for the body content. Intended for new sections going forward —
 * existing sections keep their bespoke backgrounds/layouts for this session.
 */
const Section = ({
  id,
  eyebrow,
  title,
  subtitle,
  align = 'center',
  tone = 'light',
  className,
  headingClassName,
  children,
}) => (
  <section id={id} className={cn(TONE_CLASSES[tone], className)}>
    <motion.div
      variants={stagger()}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
    >
      {(eyebrow || title || subtitle) && (
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} align={align} className={headingClassName} />
      )}
      {children}
    </motion.div>
  </section>
);

export default Section;
