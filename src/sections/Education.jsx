import { motion } from 'framer-motion';
import { GraduationCap, MapPin } from 'lucide-react';
import { Section } from '../components/ui';
import { fadeUp, stagger, viewportOnce } from '../utils/motion';
import { education } from '../data/education';

/**
 * Self-hides while `education` is empty (see src/data/education.js) — no
 * placeholder content is rendered. Add a verified entry to the data file and
 * this section appears automatically, no component change required.
 */
const Education = () => {
  if (!education.length) return null;

  return (
    <Section id="education" eyebrow="Education" title="Education" subtitle="Academic background.">
      <motion.ol
        className="mt-12 divide-y divide-slate-100 border-y border-slate-100"
        variants={stagger()}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        {education.map((entry) => {
          const dateRange = [entry.startDate, entry.endDate].filter(Boolean).join(' – ');
          return (
            <motion.li key={entry.id} variants={fadeUp} className="flex items-start gap-4 py-7 first:pt-0 last:pb-0">
              <div className="w-11 h-11 rounded-xl bg-accent/10 text-accent-strong flex items-center justify-center shrink-0">
                <GraduationCap size={20} aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-base font-bold text-primary leading-snug">{entry.credential}</h3>
                <p className="text-sm text-slate-500 font-medium mt-0.5">
                  {entry.institution}
                  {entry.field ? ` · ${entry.field}` : ''}
                </p>
                {(dateRange || entry.location) && (
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium mt-2">
                    {dateRange && <span>{dateRange}</span>}
                    {entry.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} aria-hidden="true" /> {entry.location}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.li>
          );
        })}
      </motion.ol>
    </Section>
  );
};

export default Education;
